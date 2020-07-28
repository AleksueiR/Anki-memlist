import { db, getGroupWordIds, getWordGroupIds, SentenceInResource } from '@/api/db';
import { GroupsModule, JournalsModule, Stash, WordsModule, ResourcesModule, SentencesModule } from '@/stash';
import { UpdateMode } from '@/util';
import Vue from 'vue';
import { rePopulate } from './dummy-data';

// disable tips in the console
Vue.config.devtools = false;
Vue.config.productionTip = false;

let journals: JournalsModule;
let groups: GroupsModule;
let words: WordsModule;
let resources: ResourcesModule;
let sentences: SentencesModule;

beforeEach(async () => {
    ({ journals, groups, words, resources, sentences } = new Stash());

    await rePopulate(db);
    await journals.fetch();
    return journals.setActiveId(1);
});

describe('journals/new', () => {
    test('creates a journal', async () => {
        const journalCount = await db.journals.count();

        const journalId = await journals.new('j');

        expect(journalId).toBe(journalCount + 1);
        await expect(db.journals.get(journalId)).resolves.toHaveProperty('name', 'j');
    });

    test('creates a journal (checks root group)', async () => {
        const journalId = await journals.new('j');
        const journal = (await db.journals.get(journalId))!;

        await expect(db.groups.get(journal.rootGroupId)).resolves.toHaveProperty('journalId', journalId);
    });
});

describe('journal/setDefaultGroup', () => {
    test('sets group 2 as default', async () => {
        await journals.setDefaultGroupId(2);

        expect(journals.get(journals.activeId!)?.defaultGroupId).toBe(2);
        await expect(db.journals.get(journals.activeId!)).resolves.toHaveProperty('defaultGroupId', 2);
    });

    test('sets Root Group as default', async () => {
        await expect(journals.setDefaultGroupId(1)).rejects.toThrowError();
    });

    test('sets a non-existing group as default', async () => {
        await expect(journals.setDefaultGroupId(42)).rejects.toThrowError();
    });

    test('sets a group from another journal  as default', async () => {
        await expect(journals.setDefaultGroupId(7)).rejects.toThrowError();
    });

    test('sets a default group when no journals are active', async () => {
        await journals.setActiveId();

        await expect(journals.setDefaultGroupId(2)).rejects.toThrowError(
            'journals/setDefaultGroupId: Active journal is not set.'
        );
    });
});

describe('journals/delete', () => {
    test('deletes an active journal', async () => {
        const totalGroupCount = await db.groups.count();
        const groupCount = await db.groups.where({ journalId: 1 }).count();

        const totalWordCount = await db.words.count();
        const wordCount = await db.words.where({ journalId: 1 }).count();

        await journals.delete(1);

        expect(journals.activeId).toBe(null);
        expect(journals.active).toBe(null);

        await expect(db.journals.get(1)).resolves.toBeUndefined();
        await expect(db.groups.count()).resolves.toBe(totalGroupCount - groupCount);
        await expect(db.words.count()).resolves.toBe(totalWordCount - wordCount);
    });

    test('deletes a non-active journal', async () => {
        await groups.setSelectedIds(2);

        await journals.delete(2);

        expect(journals.all[2]).toBe(undefined);
        expect(await db.groups.where({ journalId: 2 }).count()).toBe(0);
        expect(await db.words.where({ journalId: 2 }).count()).toBe(0);

        expect(journals.activeId).toBe(1);
        expect(groups.all).not.toEqual({});
        expect(words.all).not.toEqual({});
    });

    test('deletes a non-existing journal', async () => {
        await groups.setSelectedIds(2);

        await expect(journals.delete(13)).rejects.toThrowError();
    });

    test('deletes a journal with selected groups', async () => {
        await groups.setSelectedIds(2);

        await journals.delete(1);

        expect(groups.all).toEqual({});
        expect(groups.selectedIds).toEqual([]);
    });

    test('deletes a journal with selected words', async () => {
        await groups.setSelectedIds(2);
        await words.setSelectedIds(2);

        await journals.delete(1);

        expect(words.all).toEqual({});
        expect(words.selectedIds).toEqual([]);
    });
});

describe('groups/fetchJournalGroups', () => {
    test('fetches journal groups', async () => {
        const groupCount = await db.groups.where({ journalId: journals.activeId }).count();

        expect(Object.entries(groups.all).length).toBe(groupCount);
    });

    test('fetches journal groups when no active journal is set', async () => {
        await journals.setActiveId();
        await expect(groups.fetchJournalGroups()).rejects.toThrowError();
    });
});

describe('groups/setSelectedIds', () => {
    test('selects groups with no active journal', async () => {
        await journals.setActiveId();

        await expect(groups.setSelectedIds(2)).rejects.toThrowError();
    });

    test('selects Root Group', async () => {
        await expect(groups.setSelectedIds(1)).rejects.toThrowError(); // can't select the Root Group;

        await expect(groups.setSelectedIds([2, 1, 3])).rejects.toThrowError();
    });

    test('selects groups with unknown selection code', async () => {
        await expect(groups.setSelectedIds(2, 4)).rejects.toThrowError();
    });

    test('selects a single group', async () => {
        const group2count = await countWordsInGroup(2);

        await groups.setSelectedIds(2);

        expect(groups.selectedIds).toEqual([2]);

        expect(Object.values(words.all).length).toBe(group2count);
    });

    test('selects several groups', async () => {
        await groups.setSelectedIds([2, 3]);

        expect(groups.selectedIds).toEqual([2, 3]);
    });

    test('remove from selected ids', async () => {
        await groups.setSelectedIds([2, 3, 4, 5]);

        await groups.setSelectedIds([5], UpdateMode.Remove);

        expect(groups.selectedIds).toEqual([2, 3, 4]);
    });
});

describe('groups/refreshWordCounts', () => {
    test('refreshes all journal groups', async () => {
        await groups.refreshWordCounts();

        expect(groups.wordCount[2]).toEqual({ 0: 4, 1: 3, 2: 7 });
        expect(groups.wordCount[5]).toEqual({ 0: 5, 1: 3, 2: 8 });
        expect(groups.wordCount[6]).toEqual({ 0: 5, 1: 4, 2: 9 });
    });

    test('refreshes a group in another journal', async () => {
        await expect(groups.refreshWordCounts(7)).rejects.toThrowError();
    });
});

describe('groups/new', () => {
    test('creates a group', async () => {
        const groupCount = await db.groups.count();

        const groupId = await groups.new('q');

        expect(groupId).toBe(groupCount + 1);
        expect(groups.get(journals.activeId!)?.subGroupIds.includes(groupId)).toBe(true);
        expect(groups.get(groupId)).toHaveProperty('name', 'q');
        await expect(db.groups.get(groupId)).resolves.toHaveProperty('name', 'q');
    });

    test('creates a group when no journal is active', async () => {
        await journals.setActiveId();
        await expect(groups.new('q')).rejects.toThrowError();
    });
});

describe('groups/move', () => {
    test('moves a group to another group', async () => {
        await groups.move(4, 6);

        expect(groups.get(6)?.subGroupIds.includes(4)).toBe(true);
        expect(groups.get(2)?.subGroupIds.includes(4)).toBe(false);

        expect((await db.groups.get(6))?.subGroupIds.includes(4)).toBe(true);
        expect((await db.groups.get(2))?.subGroupIds.includes(4)).toBe(false);
    });

    test('moves a group to Root Group', async () => {
        await groups.move(5, 1);

        expect(groups.get(1)?.subGroupIds.includes(5)).toBe(true);
        expect(groups.get(3)?.subGroupIds.includes(5)).toBe(false);

        expect((await db.groups.get(1))?.subGroupIds.includes(5)).toBe(true);
        expect((await db.groups.get(3))?.subGroupIds.includes(5)).toBe(false);

        await expect(db.groups.where({ subGroupIds: 5 }).count()).resolves.toBe(1);
    });

    test('moves a group into the same parent', async () => {
        await groups.move(3, 2);

        await expect(db.groups.get(2)).resolves.toHaveProperty('subGroupIds', [3, 4]);
    });

    test('moves a group to a different journal', async () => {
        await expect(groups.move(2, 7)).rejects.toThrowError();
    });

    test('moves a group into itself', async () => {
        await expect(groups.move(2, 2)).rejects.toThrowError();
    });

    test('moves a group into one of its descendent subgroups', async () => {
        await expect(groups.move(2, 3)).rejects.toThrowError();

        await expect(groups.move(2, 6)).rejects.toThrowError();
    });

    test('moves Root Group', async () => {
        await expect(groups.move(1, 2)).rejects.toThrowError();
    });
});

describe('groups/delete', () => {
    test('deletes the Root Group', async () => {
        await expect(groups.delete(1)).rejects.toThrowError();
    });

    test('deletes a group in a non-active Journal', async () => {
        await expect(groups.delete(7)).rejects.toThrowError();
    });

    test('deletes a group', async () => {
        await groups.delete(6);

        await expect(db.groups.get(6)).resolves.toBeUndefined();
        await expect(db.groups.where({ subGroupIds: 6 }).count()).resolves.toBe(0); // check if the group 6 was detached

        expect(groups.get(6)).toBeUndefined();
    });

    test('deletes a group without deleting linked words', async () => {
        groups.setSelectedIds(6);

        const totalWordCount = await getTotalWordCount();
        const group6WordIds = await getGroupWordIds(6);

        const result = await Promise.all(
            group6WordIds.map(async wordId => (await db.wordsInGroups.where({ wordId }).count()) > 1)
        );

        const linkedWordCount = result.reduce((count, flag) => (flag ? ++count : count), 0);

        await groups.delete(6, false);

        await expect(getTotalWordCount()).resolves.toBe(totalWordCount - (group6WordIds.length - linkedWordCount));
    });

    test('deletes a group with words', async () => {
        const totalWordCount = await getTotalWordCount();
        const group6WordCount = await countWordsInGroup(6);

        await groups.delete(6, true);

        await expect(getTotalWordCount()).resolves.toBe(totalWordCount - group6WordCount);
    });

    test('deletes a group with subgroups', async () => {
        const groupCount = await db.groups.count();

        await groups.delete(5);

        await expect(db.groups.get(6)).resolves.toBeUndefined();
        await expect(db.groups.count()).resolves.toBe(groupCount - 2);

        await expect(db.words.get(15)).resolves.not.toBeUndefined();
        await expect(db.words.get(25)).resolves.toBeUndefined();
    });

    test('deletes a group with subgroups and words in subgroups', async () => {
        const totalWordCount = await getTotalWordCount();
        const group56WordIds = [...new Set([...(await getGroupWordIds(5)), ...(await getGroupWordIds(6))])];

        await groups.delete(5, true);

        await expect(getTotalWordCount()).resolves.toBe(totalWordCount - group56WordIds.length);
        await expect(
            db.words
                .where('id')
                .anyOf(group56WordIds)
                .count()
        ).resolves.toBe(0);
    });

    test('deletes a group and its subgroup explicitly', async () => {
        const groupCount = await db.groups.count();

        await groups.delete([5, 6]);

        await expect(db.groups.get(6)).resolves.toBeUndefined();
        await expect(db.groups.count()).resolves.toBe(groupCount - 2);
    });
});

describe('words/add', () => {
    test('add no new words', async () => {
        await groups.setSelectedIds(4);
        const result0 = await words.newOrLink(['steep', 'unbiased'], false);
        expect(result0).toEqual([void 0, void 0]);
    });

    test('add no existing words', async () => {
        await groups.setSelectedIds(4);
        const result0 = await words.newOrLink(['steeple', 'bias'], false);
        expect(result0).toEqual([28, 29]);
    });

    test('add existing and garbage words', async () => {
        await groups.setSelectedIds(4);
        const result0 = await words.newOrLink(['', 'tattoo', '    ', 'steep', '', 'unbiased', '  ', '', 'bivalve']);
        expect(result0).toEqual([void 0, 28, void 0, 1, void 0, 24, void 0, void 0, 29]);
    });

    test('adds words with garbage input', async () => {
        await groups.setSelectedIds(2);
        const totalWordCount = await db.words.count();

        const result0 = await words.newOrLink(['', '    ']);
        expect(result0).toEqual([void 0, void 0]);

        const result1 = await words.newOrLink(['', '    ', 'hallo']);
        expect(result1).toEqual([void 0, void 0, totalWordCount + 1]);
        await expect(db.wordsInGroups.where({ wordId: result1[2], groupId: 2 }).count()).resolves.toBe(1);
    });

    test('adds duplicate words to as single group', async () => {
        await groups.setSelectedIds(2);
        const totalWordCount = await db.words.count();

        // duplicate words will return the same id
        const result0 = await words.newOrLink(['dot', 'dot', 'dot']);
        expect(result0).toEqual([totalWordCount + 1, totalWordCount + 1, totalWordCount + 1]);
        await expect(db.wordsInGroups.where({ wordId: totalWordCount + 1, groupId: 2 }).count()).resolves.toBe(1);
    });

    test('adds words when not groups are selected', async () => {
        await expect(words.newOrLink('test1')).rejects.toThrowError(); // no groups selected

        await expect(words.newOrLink(['test1', 'test2'])).rejects.toThrowError();
    });

    test('adds a new word to a single group', async () => {
        await groups.refreshWordCounts();
        const group2WordCount = await db.wordsInGroups.where({ groupId: 2 }).count();

        await groups.setSelectedIds(2);

        const [result0] = (await words.newOrLink('test1')) as number[];

        expect(result0).not.toBeUndefined();

        await expect(db.wordsInGroups.where({ wordId: result0, groupId: 2 }).count()).resolves.toBe(1);
        await expect(db.wordsInGroups.where({ groupId: 2 }).count()).resolves.toBe(group2WordCount + 1);
    });

    test('adds several new words to a single group', async () => {
        await groups.refreshWordCounts();
        const group2WordCount = await db.wordsInGroups.where({ groupId: 2 }).count();

        await groups.setSelectedIds(2);
        const [result0, result1] = (await words.newOrLink(['test1', 'test2'])) as number[];

        await expect(db.wordsInGroups.where({ wordId: result0, groupId: 2 }).count()).resolves.toBe(1);
        await expect(db.wordsInGroups.where({ wordId: result1, groupId: 2 }).count()).resolves.toBe(1);

        await expect(db.wordsInGroups.where({ groupId: 2 }).count()).resolves.toBe(group2WordCount + 2);
    });

    test('adds a new word to several groups', async () => {
        await groups.refreshWordCounts();
        const group2WordCount = await db.wordsInGroups.where({ groupId: 2 }).count();
        const group3WordCount = await db.wordsInGroups.where({ groupId: 3 }).count();

        await groups.setSelectedIds([2, 3]);
        const [result0] = (await words.newOrLink('test1')) as number[];

        expect(result0).not.toBeUndefined();

        await expect(getWordGroupIds(result0)).resolves.toEqual([2, 3]);

        await expect(db.wordsInGroups.where({ groupId: 2 }).count()).resolves.toBe(group2WordCount + 1);
        await expect(db.wordsInGroups.where({ groupId: 3 }).count()).resolves.toBe(group3WordCount + 1);
    });

    test('adds several new words to several groups', async () => {
        const group2WordCount = await db.wordsInGroups.where({ groupId: 2 }).count();
        const group3WordCount = await db.wordsInGroups.where({ groupId: 3 }).count();

        await groups.setSelectedIds([2, 3]);

        const [result0, result1] = (await words.newOrLink(['test1', 'test2'])) as number[];

        await expect(getWordGroupIds(result0)).resolves.toEqual([2, 3]);
        await expect(getWordGroupIds(result1)).resolves.toEqual([2, 3]);
    });

    test('adds an existing word to its parent group', async () => {
        const group2WordCount = await db.wordsInGroups.where({ groupId: 2 }).count();

        await groups.setSelectedIds(2);

        const [result0] = (await words.newOrLink('steep')) as number[];

        expect(result0).toBe(1);

        await expect(db.wordsInGroups.where({ wordId: result0, groupId: 2 }).count()).resolves.toBe(1);

        await expect(countWordsInGroup(2)).resolves.toBe(group2WordCount);
    });

    test('adds an existing word to a different group', async () => {
        await groups.setSelectedIds(3);

        const wordCount = await db.words.count();

        const [result0] = (await words.newOrLink('steep')) as number[];

        expect(result0).toBe(1);

        await expect(getWordGroupIds(result0)).resolves.toEqual([2, 3]);
        await expect(countWordsInGroup(3)).resolves.toBe(10);
        await expect(db.words.count()).resolves.toBe(wordCount); // "steep" was not in group 3
    });

    test('adds an existing word to several groups', async () => {
        await groups.setSelectedIds([2, 3, 4]);

        const wordCount = await db.words.count();

        const [result0] = (await words.newOrLink('steep')) as number[];

        expect(result0).toBe(1);

        await expect(getWordGroupIds(result0)).resolves.toEqual([2, 3, 4]);
        await expect(countWordsInGroup(2)).resolves.toBe(7);
        await expect(countWordsInGroup(3)).resolves.toBe(10);
        await expect(countWordsInGroup(4)).resolves.toBe(8);

        await expect(db.words.count()).resolves.toBe(wordCount);
    });

    test('adds an existing from another journal', async () => {
        await groups.setSelectedIds(3);

        const wordId = await words.newOrLink('parent');

        // the word should not be linked across journals
        expect(wordId).not.toBe(27);
    });

    test('adds an existing and a new word to a single group', async () => {
        await groups.setSelectedIds(3);

        const wordCount = await db.words.count();

        const [result0, result1] = (await words.newOrLink(['steep', 'test1'])) as number[];

        expect(result0).not.toBe(0);
        expect(result1).not.toBe(0);

        await expect(getWordGroupIds(result0)).resolves.toEqual([2, 3]);
        await expect(getWordGroupIds(result1)).resolves.toEqual([3]);

        await expect(countWordsInGroup(3)).resolves.toBe(11);

        await expect(db.words.count()).resolves.toBe(wordCount + 1); // "steep" was not in group 3
    });
});

describe.only('words/findDuplicateWords', () => {
    test('use all existing words', async () => {
        const wordList = ['steep', 'hilarious', 'work', 'ray'].sort();
        const [newWords, existingWords] = await words.findDuplicateWords(wordList, 1);

        expect(newWords).toEqual([]);
        expect(existingWords.sort()).toEqual(wordList);
    });

    test('use existing words from other journal', async () => {
        const wordList = ['company', 'parent'].sort();
        const [newWords, existingWords] = await words.findDuplicateWords(wordList, 1);

        expect(newWords).toEqual(wordList);
        expect(existingWords.sort()).toEqual([]);
    });

    test('use all new words', async () => {
        const wordList = ['steeple', 'cup', 'worker'].sort();
        const [newWords, existingWords] = await words.findDuplicateWords(wordList, 1);

        expect(newWords).toEqual(wordList);
        expect(existingWords.sort()).toEqual([]);
    });

    test('use new and existing words', async () => {
        const existingWordList = ['steep', 'hilarious', 'work', 'ray'].sort();
        const newWordList = ['steeple', 'cup', 'worker'].sort();

        const [newWords, existingWords] = await words.findDuplicateWords([...existingWordList, ...newWordList], 1);

        expect(newWords).toEqual(newWordList);
        expect(existingWords.sort()).toEqual(existingWordList);
    });
});

describe('words/setSelectedIds', () => {
    test('remove from selected ids', async () => {
        await groups.setSelectedIds(2);

        await words.setSelectedIds([1, 2, 3, 4, 5]);
        await words.setSelectedIds([3, 2], UpdateMode.Remove);

        expect(words.selectedIds).toEqual([1, 4, 5]);
    });
});

describe('words/move', () => {
    test('moves a single word', async () => {
        await groups.setSelectedIds([2, 3]);

        const group2WordCount = await countWordsInGroup(2);
        const group3WordCount = await countWordsInGroup(3);

        await words.move(1, 2, 3);

        await expect(countWordsInGroup(2)).resolves.toBe(group2WordCount - 1);
        await expect(countWordsInGroup(3)).resolves.toBe(group3WordCount + 1);
    });

    test('moves a single word to the same group', async () => {
        await groups.setSelectedIds(2);

        const group2WordCount = await countWordsInGroup(2);

        await words.move(1, 2, 2);

        await expect(getWordGroupIds(1)).resolves.toEqual([2]);

        await expect(countWordsInGroup(2)).resolves.toBe(group2WordCount);
    });

    test('moves a single word to a non-existent group', async () => {
        await groups.setSelectedIds(2);

        await expect(words.move(1, 2, 395)).rejects.toThrowError();
    });

    test('moves a single word from a non-existent and a regular group', async () => {
        await groups.setSelectedIds([2, 3]);

        await expect(words.move(1, [2, 395], 3)).rejects.toThrowError();
        await expect(words.move(1, 234, 3)).rejects.toThrowError();
    });

    test('moves several words', async () => {
        await groups.setSelectedIds([2, 3]);

        const group2WordCount = await countWordsInGroup(2);
        const group3WordCount = await countWordsInGroup(3);
        await words.move([1, 2, 3], 2, 3);

        await expect(countWordsInGroup(2)).resolves.toBe(group2WordCount - 3);
        await expect(countWordsInGroup(3)).resolves.toBe(group3WordCount + 3);
    });

    test('moves all group words', async () => {
        await groups.setSelectedIds([2, 3]);

        const group3WordCount = await countWordsInGroup(3);
        await words.move([1, 2, 3, 4, 5, 6, 18], 2, 3);

        await expect(countWordsInGroup(2)).resolves.toBe(0);
        // words 5 and 6 belong to group 3 already
        await expect(countWordsInGroup(3)).resolves.toBe(group3WordCount + 5);
    });

    test('moves a single word to the Root Group', async () => {
        await groups.setSelectedIds(2);

        await expect(words.move(1, 2, 1)).rejects.toThrowError();
    });

    test('moves a single word to another Journal', async () => {
        await groups.setSelectedIds([2]);

        await expect(words.move(1, 2, 7)).rejects.toThrowError();
        await expect(getWordGroupIds(1)).resolves.toEqual([2]);
    });
});

describe('words/delete', () => {
    test('deletes a single word from a selected group', async () => {
        await groups.setSelectedIds(6);

        const group6WordCount = await countWordsInGroup(6);

        await words.delete(25);

        await expect(countWordsInGroup(6)).resolves.toBe(group6WordCount - 1);

        expect(words.get(25)).toBeUndefined();
    });

    test('deletes a linked word from a single group', async () => {
        await groups.setSelectedIds(2);

        const group2WordCount = await countWordsInGroup(2);
        const group3WordCount = await countWordsInGroup(3);

        await words.delete(5, 2);

        await expect(countWordsInGroup(2)).resolves.toBe(group2WordCount - 1);
        await expect(countWordsInGroup(3)).resolves.toBe(group3WordCount);
    });

    test('deletes a linked word from a non-existing group', async () => {
        const totalWordCount = await getTotalWordCount();

        await expect(words.delete(5, 27)).resolves.toBeUndefined();

        // nothing should change
        await expect(db.words.count()).resolves.toBe(totalWordCount);
    });

    test('deletes a linked word from all groups', async () => {
        await groups.setSelectedIds([2, 3, 5, 6]);

        await words.delete(5, true);

        await expect(db.words.get(5)).resolves.toBeUndefined();
    });

    test('deletes a single word from a non-active journal', async () => {
        await expect(words.delete(26)).rejects.toThrowError();

        expect(await db.words.get(26)).not.toBe(undefined);
    });

    test('deletes a non-existing word from an active journal', async () => {
        const totalWordCount = await db.words.count();

        await expect(words.delete(957)).rejects.toThrowError();
        await expect(db.words.count()).resolves.toBe(totalWordCount);
    });

    test('deletes several words from several groups', async () => {
        const totalWordCount = await db.words.count();

        await groups.setSelectedIds([2, 4, 6]);

        await words.delete([5, 6], [2, 4]);

        await expect(getWordGroupIds(5)).resolves.toEqual([3, 5, 6]);
        await expect(getWordGroupIds(6)).resolves.toEqual([3, 5, 6]);

        expect(await db.words.count()).toBe(totalWordCount);
    });

    test('deletes a word from its group to make an orphaned word', async () => {
        await groups.setSelectedIds(2);

        await words.delete(1, 2);

        await expect(db.words.get(1)).resolves.toBeUndefined();
    });

    test('deletes a word from a non-selected groups', async () => {
        await groups.setSelectedIds(2);

        const totalWordCount = await db.words.count();
        const group6WordCount = await countWordsInGroup(6);

        await words.delete(23, true);

        await expect(countWordsInGroup(6)).resolves.toBe(group6WordCount - 1);
        await expect(db.words.count()).resolves.toBe(totalWordCount - 1);
    });
});

describe('resources/new', () => {
    test('adds a new resource', async () => {
        const resourceId = await resources.new('alice in quantum land');

        expect(journals.get(resourceId)).not.toBeUndefined();
        await expect(db.resources.get(resourceId)).resolves.toHaveProperty('name', 'alice in quantum land');
    });

    test('adds a new resource without active journal', async () => {
        journals.setActiveId();

        await expect(resources.new('alice in quantum land')).rejects.toThrowError();
    });
});

describe('resources/findDuplicateSentences', () => {
    test('use an existing sentence', async () => {
        await resources.fetchJournalResources();

        const [newTexts, duplicateTexts] = await sentences.findDuplicateSentences(['In the matter of Universals.'], 1);

        expect(newTexts.length).toBe(0);
        expect(duplicateTexts.length).toBe(1);
    });

    test('use a new sentence', async () => {
        await resources.fetchJournalResources();

        const [newTexts, duplicateTexts] = await sentences.findDuplicateSentences(['All your base'], 1);

        expect(newTexts.length).toBe(1);
        expect(duplicateTexts.length).toBe(0);
    });

    test('use an existing and a  new sentence', async () => {
        await resources.fetchJournalResources();

        const [newTexts, duplicateTexts] = await sentences.findDuplicateSentences(
            ['In the matter of Universals.', 'All your base'],
            1
        );

        expect(newTexts.length).toBe(1);
        expect(duplicateTexts.length).toBe(1);
    });
});

describe('sentences/new', () => {
    test('adds a new sentence to a resource', async () => {
        const resource1Count = await countSentencesInResources(1);

        const [sentenceId] = await sentences.new(
            'The first entry in the schema string will always represent the primary key.'
        );

        await sentences.putSentencesInResource([sentenceId], 1);

        await expect(db.sentencesInResources.where({ sentenceId }).count()).resolves.toBe(1);
        await expect(countSentencesInResources(1)).resolves.toBe(resource1Count + 1);
    });
});

async function getTotalWordCount() {
    return await db.words.count();
}

function countSentencesInResources(resourceId: number) {
    return db.sentencesInResources.where({ resourceId }).count();
}

function countWordsInGroup(groupId: number) {
    return db.wordsInGroups.where({ groupId }).count();
}

function countGroupsOfWord(wordId: number) {
    return db.wordsInGroups.where({ wordId }).count();
}

// more tests
// - selectedIds([2,2])
// - try to link a word from another journal
// - load groups with linked words and check the number of words loaded
