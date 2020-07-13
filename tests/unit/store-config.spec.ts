import { db } from '@/api/db';
import { GroupsModule, JournalsModule, Stash, WordsModule } from '@/stash';
import Vue from 'vue';
import { rePopulate } from './dummy-data';

// disable tips in the console
Vue.config.devtools = false;
Vue.config.productionTip = false;

let journals: JournalsModule;
let groups: GroupsModule;
let words: WordsModule;

beforeEach(async () => {
    ({ journals, groups, words } = new Stash());

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
        await journals.delete(1);

        expect(journals.activeId).toBe(null);
        expect(journals.active).toBe(null);
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

        await journals.delete(13);

        expect(journals.activeId).not.toBe(null);
        expect(journals.active).not.toBe(null);

        expect(groups.all).not.toEqual({});
        expect(words.all).not.toEqual({});
    });

    test('deletes a journal with selected groups', async () => {
        await groups.setSelectedIds(2);

        await journals.delete(1);

        expect(groups.all).toEqual({});
        expect(groups.selectedIds).toEqual([]);
    });

    test.skip('deletes a journal with selected words', async () => {
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

    test('selects Root Groups', async () => {
        await expect(groups.setSelectedIds(1)).rejects.toThrowError(); // can't select the Root Group;

        await expect(groups.setSelectedIds([2, 1, 3])).rejects.toThrowError();
    });

    test('selects groups with unknown selection code', async () => {
        await expect(groups.setSelectedIds(2, 4)).rejects.toThrowError();
    });

    test('selects a single group', async () => {
        await groups.setSelectedIds(2);

        const wordCount = await db.words
            .where('memberGroupIds')
            .anyOf(2)
            .count();

        expect(groups.selectedIds).toEqual([2]);
        expect(groups.wordCount[2]).toEqual(wordCount);
        expect(Object.entries(words.all).length).toBe(wordCount);
    });

    test('selects several groups', async () => {
        await groups.setSelectedIds([2, 3]);

        const wordCountDistinct = await db.words
            .where('memberGroupIds')
            .anyOf([2, 3])
            .distinct()
            .count();

        const wordCountWithDuplicates = await db.words
            .where('memberGroupIds')
            .anyOf([2, 3])
            .count();

        expect(groups.selectedIds).toEqual([2, 3]);
        expect(groups.wordCount[2] + groups.wordCount[3]).toEqual(wordCountWithDuplicates);
        expect(Object.entries(words.all).length).toBe(wordCountDistinct);
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
    test('moves a group to a different journal', async () => {
        await expect(groups.move(2, 7)).rejects.toThrowError();
    });

    test('moves a group into the same parent', async () => {
        await groups.move(3, 2);
        expect(groups.get(2)?.subGroupIds.includes(3)).toBe(true);
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

describe.skip('creating new words', () => {
    test('adds words with garbage input', async () => {
        await groups.setSelectedIds(2);
        const totalWordCount = await db.words.count();

        const result0 = await words.new(['', '    ']);
        expect(result0).toEqual([void 0, void 0]);

        const result1 = await words.new(['', '    ', 'hallo']);
        expect(result1).toEqual([void 0, void 0, totalWordCount + 1]);
    });

    test('adds duplicate words to as single group', async () => {
        await groups.setSelectedIds(2);
        const totalWordCount = await db.words.count();

        // duplicate words will return the same id
        const result0 = await words.new(['dot', 'dot', 'dot']);
        expect(result0).toEqual([totalWordCount + 1, totalWordCount + 1, totalWordCount + 1]);
        expect(words.get(totalWordCount + 1)?.memberGroupIds).toEqual([2]);
    });

    test('adds words when not groups are selected', async () => {
        const err0 = await words.new('test1');
        expect(err0).toBe(0); // no groups selected

        const err1 = await words.new(['test1', 'test2']);
        expect(err1).toBe(0); // no groups selected
    });

    test('adds a new word to a single group', async () => {
        const group2WordCount = groups.wordCount[2];

        await groups.setSelectedIds(2);

        const result0 = await words.new('test1');

        expect(result0).not.toBe(0);
        expect(words.get(result0)?.memberGroupIds).toEqual([2]);
        expect(groups.wordCount[2]).toBe(group2WordCount + 1);
    });

    test('adds several new words to a single group', async () => {
        const group2WordCount = groups.wordCount[2];

        await groups.setSelectedIds(2);
        const [result0, result1] = (await words.new(['test1', 'test2'])) as number[];

        expect(words.get(result0)?.memberGroupIds).toEqual([2]);
        expect(words.get(result1)?.memberGroupIds).toEqual([2]);
        expect(groups.wordCount[2]).toBe(group2WordCount + 2);
    });

    test('adds a new word to several groups', async () => {
        const group2WordCount = groups.wordCount[2];
        const group3WordCount = groups.wordCount[3];

        await groups.setSelectedIds([2, 3]);
        const result0 = await words.new('test1');

        expect(result0).not.toBe(0);
        expect(words.get(result0)?.memberGroupIds).toEqual([2, 3]);
        expect(groups.wordCount[2]).toBe(group2WordCount + 1);
        expect(groups.wordCount[3]).toBe(group3WordCount + 1);
    });

    test('adds several new words to several groups', async () => {
        const group2WordCount = groups.wordCount[2];
        const group3WordCount = groups.wordCount[3];

        await groups.setSelectedIds([2, 3]);

        const [result0, result1] = (await words.new(['test1', 'test2'])) as number[];
        expect(words.get(result0)?.memberGroupIds).toEqual([2, 3]);
        expect(words.get(result1)?.memberGroupIds).toEqual([2, 3]);

        expect(groups.wordCount[2]).toBe(group2WordCount + 2);
        expect(groups.wordCount[3]).toBe(group3WordCount + 2);
    });

    test('adds an existing word to its parent group', async () => {
        await groups.setSelectedIds(2);

        const group2WordCount = groups.wordCount[2];

        const result1 = await words.new('steep');
        expect(result1).toBe(1);
        expect(words.get(1)?.memberGroupIds).toEqual([2]);
        expect(groups.wordCount[2]).toBe(7);
        expect(Object.keys(words.all).length).toBe(group2WordCount);
    });

    test('adds an existing word to a different group', async () => {
        await groups.setSelectedIds(3);

        const wordCount = Object.keys(words.all).length;

        const result0 = await words.new('steep');

        expect(result0).toBe(1);
        expect(words.get(result0)?.memberGroupIds).toEqual([2, 3]);
        expect(groups.wordCount[3]).toBe(10);
        expect(Object.keys(words.all).length).toBe(wordCount + 1); // "steep" was not in group 3
    });

    test('adds an existing word to several groups', async () => {
        await groups.setSelectedIds([2, 3, 4]);

        const wordCount = Object.keys(words.all).length;

        const result0 = await words.new('steep');
        expect(result0).toBe(1);
        expect(words.get(result0)?.memberGroupIds).toEqual([2, 3, 4]);
        expect(groups.wordCount[2]).toBe(7);
        expect(groups.wordCount[3]).toBe(10);
        expect(groups.wordCount[4]).toBe(8);
        expect(Object.keys(words.all).length).toBe(wordCount);
    });

    test('adds an existing and a new word to a single group', async () => {
        await groups.setSelectedIds(3);

        const wordCount = Object.keys(words.all).length;

        const [result0, result1] = (await words.new(['steep', 'test1'])) as number[];
        expect(result0).not.toBe(0);
        expect(result1).not.toBe(0);
        expect(words.get(result0)?.memberGroupIds).toEqual([2, 3]);
        expect(words.get(result1)?.memberGroupIds).toEqual([3]);
        expect(groups.wordCount[3]).toBe(11);
        expect(Object.keys(words.all).length).toBe(wordCount + 2); // "steep" was not in group 3
    });
});

describe('words/move', () => {
    test('moves a single word', async () => {
        await groups.setSelectedIds([2, 3]);
        await groups.refreshWordCounts();

        const group3WordCount = groups.wordCount[3];

        await words.move(1, 2, 3);

        await groups.refreshWordCounts();

        expect(words.get(1)?.memberGroupIds).toEqual([3]);
        expect(groups.wordCount[3]).toBe(group3WordCount + 1);
    });

    test('moves a single word to the same group', async () => {
        await groups.setSelectedIds(2);
        await groups.refreshWordCounts();

        const group2WordCount = groups.wordCount[2];

        await words.move(1, 2, 2);

        expect(words.get(1)?.memberGroupIds).toEqual([2]);
        expect(groups.wordCount[2]).toBe(group2WordCount);
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

    test('moves a single word from a non-selected group', async () => {
        await groups.setSelectedIds(3);

        await expect(words.move(1, 2, 3)).rejects.toThrowError();
    });

    test('moves several words', async () => {
        await groups.setSelectedIds([2, 3]);
        await groups.refreshWordCounts();

        const group2WordCount = groups.wordCount[2];
        const group3WordCount = groups.wordCount[3];
        await words.move([1, 2, 3], 2, 3);

        await groups.refreshWordCounts();

        expect(groups.wordCount[2]).toBe(group2WordCount - 3);
        expect(groups.wordCount[3]).toBe(group3WordCount + 3);
    });

    test('moves all group words', async () => {
        await groups.setSelectedIds([2, 3]);
        await groups.refreshWordCounts();

        const group3WordCount = groups.wordCount[3];
        await words.move([1, 2, 3, 4, 5, 6, 18], 2, 3);

        await groups.refreshWordCounts();

        expect(groups.wordCount[2]).toBe(0);
        // words 5 and 6 belong to group 3 already
        expect(groups.wordCount[3]).toBe(group3WordCount + 5);
    });

    test('moves a single word to the Root Group', async () => {
        await groups.setSelectedIds(2);

        await expect(words.move(1, 2, 1)).rejects.toThrowError();
    });

    test('moves a single word to another Journal', async () => {
        await groups.setSelectedIds([2]);

        await expect(words.move(1, 2, 7)).rejects.toThrowError();
    });
});

describe('words/delete', () => {
    test('deletes a single word from a selected group', async () => {
        await groups.setSelectedIds(6);
        await groups.refreshWordCounts();

        const group6WordCount = groups.wordCount[6];
        const groupWordCount = { ...groups.wordCount };

        await words.delete(25);
        await groups.refreshWordCounts();

        expect(groups.wordCount[6]).toBe(group6WordCount - 1);
        expect(groups.wordCount).not.toEqual(groupWordCount);
    });

    test('deletes a linked word from a single group', async () => {
        await groups.setSelectedIds(2);
        await groups.refreshWordCounts();

        const group2WordCount = groups.wordCount[2];
        const group3WordCount = groups.wordCount[3];

        await words.delete(5, 2);
        await groups.refreshWordCounts();

        expect(groups.wordCount[2]).toBe(group2WordCount - 1);
        expect(groups.wordCount[3]).toBe(group3WordCount);
    });

    test('deletes a linked word from a non-existing group', async () => {
        await expect(words.delete(5, 27)).rejects.toThrowError();
    });

    test('deletes a linked word from all groups', async () => {
        await groups.setSelectedIds([2, 3, 5, 6]);

        await words.delete(5);

        await expect(db.words.get(5)).resolves.toBeUndefined();
    });

    test('deletes a single word from a non-active journal', async () => {
        await expect(words.delete(26)).rejects.toThrowError();

        expect(await db.words.get(26)).not.toBe(undefined);
    });

    test('deletes a non-existing word from an active journal', async () => {
        await expect(words.delete(957)).rejects.toThrowError();
    });

    test('deletes several words from several groups', async () => {
        const totalWordCount = await db.words.count();

        await groups.setSelectedIds([2, 4, 6]);

        await words.delete([5, 6], [2, 4]);

        expect(words.get(5)?.memberGroupIds).toEqual([3, 5, 6]);
        expect(words.get(6)?.memberGroupIds).toEqual([3, 5, 6]);

        expect(await db.words.count()).toBe(totalWordCount);
    });
});

// more tests
// - selectedIds([2,2])
// - try to link a word from another journal
// - try some garbage input instead of words
