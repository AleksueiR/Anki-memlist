import { db } from '@/api/db';
import { GroupsModule, JournalsModule, Stash, WordsModule } from '@/stash';
import { rePopulate } from './dummy-data';

let journals: JournalsModule;
let groups: GroupsModule;
let words: WordsModule;

beforeEach(async () => {
    ({ journals, groups, words } = new Stash());

    await rePopulate(db);
    return journals.fetch();
});

test.skip('creates journals', async () => {
    expect(journals.activeId).toBe(1);

    const journal = journals.active!;

    expect(journal.rootGroupId).toBe(1);
    expect(journal.defaultGroupId).toBe(null);

    await journals.setDefaultGroupId(2);
    expect(journal.defaultGroupId).toBe(2);

    // create a new journal
    const newJournalId = await journals.new('new journal');
    expect(newJournalId).toBe(2);
    expect(Object.entries(journals.all).length).toBe(2);

    // check journal values
    const newJournal = journals.get(newJournalId)!;
    expect(newJournal.id).toBe(2);
    expect(newJournal.defaultGroupId).toBe(null);
    expect(newJournal.rootGroupId).toBe(7);
    expect(newJournal.name).toBe('new journal');

    // set it to active
    await journals.setActiveId(newJournalId);
    expect(journals.active).toBe(newJournal);
});

test.skip('moves groups', async () => {
    const rootGroup = groups.get(1)!;

    // check default subgroups
    expect(rootGroup.subGroupIds).toEqual([2, 3, 4, 5, 6]);
    expect(groups.get(2)?.subGroupIds).toEqual([]);

    // move things around
    await groups.move(6, 2);

    expect(groups.get(2)?.subGroupIds).toEqual([6]);
    expect(rootGroup.subGroupIds).toEqual([2, 3, 4, 5]);

    // create a new group
    const newGroupId = await groups.new('new group');
    expect(newGroupId).toBe(7);

    expect(rootGroup.subGroupIds).toEqual([2, 3, 4, 5, 7]);

    // move it
    await groups.move(7, 6);

    expect(rootGroup.subGroupIds).toEqual([2, 3, 4, 5]);
    expect(groups.get(2)?.subGroupIds).toEqual([6]);
    expect(groups.get(6)?.subGroupIds).toEqual([7]);

    // move everything to 2
    await groups.move(5, 2);
    await groups.move(4, 2);
    await groups.move(3, 2);
    await groups.move(7, 2);

    expect(rootGroup.subGroupIds).toEqual([2]);
    expect(groups.get(2)?.subGroupIds.sort()).toEqual([3, 4, 5, 6, 7]);
    expect(groups.get(6)?.subGroupIds).toEqual([]);
    // TODO: try moving groups between journals and root groups too
});

test('selects groups with no active journal', async () => {
    journals.setActiveId();

    const err0 = await groups.setSelectedIds(2);
    expect(err0).toBe(0);
});

test('selects Root Groups', async () => {
    await groups.setSelectedIds(1);
    expect(groups.selectedIds.includes(1)).toBe(false); // can't select the Root Group;

    await groups.setSelectedIds([2, 1, 3]);
    expect(groups.selectedIds.includes(1)).toBe(false); // can't select the Root Group;
    expect(groups.selectedIds).toEqual([2, 3]); // can't select the Root Group;
});

describe('moving groups', async () => {
    test('moves a group to a different journal', async () => {
        // try silly things
        const err0 = await groups.move(2, 7);
        expect(err0).toBe(0);
    });

    test('moves a group into the same parent', async () => {
        // try silly things
        const err0 = await groups.move(3, 2);
        expect(err0).toBe(0);
        expect(groups.get(2)?.subGroupIds.includes(3)).toBe(true);
    });

    test('moves a group into itself', async () => {
        // try silly things
        const err0 = await groups.move(2, 2);
        expect(err0).toBe(0);
        expect(!groups.get(2)?.subGroupIds.includes(2)).toBe(true);
    });

    test('moves a group into one of its descendent subgroups', async () => {
        // try silly things
        const err0 = await groups.move(2, 3);
        expect(err0).toBe(0);
        expect(!groups.get(3)?.subGroupIds.includes(2)).toBe(true);

        const err1 = await groups.move(2, 6);
        expect(err1).toBe(0);
        expect(!groups.get(6)?.subGroupIds.includes(2)).toBe(true);
    });

    test('moves Root Group', async () => {
        // try moving the root group
        const err0 = await groups.move(1, 2);
        expect(err0).toBe(0);
        expect(groups.get(2)?.subGroupIds.sort()).toEqual([3, 4]);
    });
});

describe('creating new words', () => {
    test('adds words with garbage input', async () => {
        await groups.setSelectedIds(2);
        const totalWordCount = await db.words.count();

        const result0 = await words.new(['', '    ']);
        expect(result0).toEqual([void 0, void 0]);

        const result1 = await words.new(['', '    ', 'hallo']);
        expect(result1).toEqual([void 0, void 0, totalWordCount + 1]);
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

// more tests
// - selectedIds([2,2])
// - try to link a word from another journal
// - try some garbage input instead of words

test('increments "count" value when "increment" is committed', async () => {
    const journal = journals.active!;

    expect(journal.rootGroupId).toBe(1);
    expect(journals.activeId).toBe(1);

    const newJournalId = await journals.new('test');

    const newJournal = await db.journals.get(newJournalId);

    expect(newJournal).not.toBeUndefined();
    expect(newJournal!.name).toBe('test');
    expect(newJournal!.id).toBe(newJournalId);

    expect(newJournal).toEqual(journals.all[newJournalId]);

    journals.reset();

    expect(Object.entries(journals.all).length).toBe(0);
});
