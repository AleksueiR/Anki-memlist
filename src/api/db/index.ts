import Dexie, { DBCoreRangeType, Table } from 'dexie';
import { wrapInArray } from '@/util';

Dexie.delete('word-pouch');

export enum GroupDisplayMode {
    Active = 0,
    Archived = 1,
    All = 2
}

export type WordArchived = GroupDisplayMode.Active | GroupDisplayMode.Archived;

export interface DBEntry {
    readonly id: number;
}

// export interface DBJournalEntry extends DBEntry {}

export interface DBCommonEntry extends DBEntry {
    readonly journalId: number;
}

export class Journal implements DBEntry {
    readonly id: number;

    constructor(
        public name: string = 'Default Journal',
        public rootGroupId: number = -1,
        public defaultGroupId: number | null = null
    ) {}
}

export class Group implements DBCommonEntry {
    readonly id: number;

    constructor(
        public name: string,
        public journalId: number,
        public displayMode: GroupDisplayMode = GroupDisplayMode.All,
        public subGroupIds: number[] = []
    ) {}
}

export class Word implements DBCommonEntry {
    readonly id: number;

    constructor(
        public text: string,
        public journalId: number,
        public memberGroupIds: number[] = [],
        public isArchived: WordArchived = GroupDisplayMode.Active
    ) {}
}

export class WordInGroup implements DBEntry {
    readonly id: number;

    constructor(public wordId: number, public groupId: number) {}
}

export class WordPouch extends Dexie {
    // Declare implicit table properties.
    // (just to inform Typescript. Instantiated by Dexie in stores() method)
    journals: Dexie.Table<Journal, number>; // number = type of the primary key
    groups: Dexie.Table<Group, number>;
    words: Dexie.Table<Word, number>;
    wordsInGroups: Dexie.Table<WordInGroup, [number, number]>;

    // NOTE: maybe it will be worth to use many-to-many junction for words-in-group as described here: https://github.com/dfahlander/Dexie.js/issues/815

    constructor() {
        super('word-pouch');
        this.version(1).stores({
            // A compound index cannot be marked MultiEntry. The limitation lies within indexedDB itself. :/
            journals: '++id, name, rootGroupId',
            groups: '++id, journalId, [id+journalId], name, displayMode, *subGroupIds',
            words: '++id, journalId, [id+journalId], text, isArchived, *memberGroupIds',
            wordsInGroups: '[wordId+groupId], wordId, groupId'
        });

        this.journals.mapToClass(Journal);
        this.journals.mapToClass(Group);
        this.journals.mapToClass(Word);
        this.journals.mapToClass(WordInGroup);
    }
}

const db = new WordPouch();

// pack, deck, collection, list, trove, stash, lexicon, dictionary, wordstock, diction, journal, binder
// base, hub, site,
// lexicon
// journal/bundle/section?/story/branch?/bough
// word
// journals/groups/words

// TODO: testsing
async function rePopulate(db: WordPouch): Promise<void> {
    /* await db.journals.clear();
    await db.groups.clear();
    await db.words.clear(); */

    await db.delete();
    await db.open();

    // db.on('populate', async () => {
    const journalId1 = await db.journals.add(new Journal('Second Journal'));

    const rootGroupId1 = await db.groups.add(new Group('Root group', journalId1));
    await db.journals.update(journalId1, { rootGroupId: rootGroupId1 });

    const groupIds1 = await db.groups.bulkAdd(
        [
            new Group('Group Two', journalId1, GroupDisplayMode.All, [3, 4]),
            new Group('Group Three', journalId1, GroupDisplayMode.All, [5]),
            new Group('Group Four', journalId1, GroupDisplayMode.All),
            new Group('Group Five', journalId1, GroupDisplayMode.Archived, [6]),
            new Group('Group Six', journalId1, GroupDisplayMode.Active)
        ],
        { allKeys: true }
    );

    await db.groups.update(rootGroupId1, { subGroupIds: groupIds1 });

    // create a second Journal
    const journalId2 = await db.journals.add(new Journal('Second Journal'));

    const rootGroupId2 = await db.groups.add(new Group('Root group Two', journalId2));
    await db.journals.update(journalId2, { rootGroupId: rootGroupId2 });

    const groupIds2 = await db.groups.bulkAdd(
        [new Group('Group Seven Two', journalId2), new Group('Group Eight Two', journalId2)],
        { allKeys: true }
    );
    await db.groups.update(rootGroupId2, { subGroupIds: groupIds2 });

    await db.words.bulkAdd([
        new Word('steep', journalId1, [2]), // 1
        new Word('hilarious', journalId1, [2]), // 2
        new Word('work', journalId1, [2], GroupDisplayMode.Archived), // 3
        new Word('ray', journalId1, [2], GroupDisplayMode.Archived), // 4
        new Word('youthful', journalId1, [2, 3, 5, 6]), // 5
        new Word('apparatus', journalId1, [2, 3, 4, 5, 6], GroupDisplayMode.Archived), // 6

        new Word('treasure', journalId1, [3], GroupDisplayMode.Archived), // 7
        new Word('office', journalId1, [3]), // 8
        new Word('gleaming', journalId1, [3]), // 9
        new Word('twist', journalId1, [3]), // 10
        new Word('trust', journalId1, [3]), // 11

        new Word('lace', journalId1, [4], GroupDisplayMode.Archived), // 12

        new Word('knife', journalId1, [4, 3], GroupDisplayMode.Archived), // 13
        new Word('grab', journalId1, [4, 6], GroupDisplayMode.Archived), // 14
        new Word('tan', journalId1, [4, 6], GroupDisplayMode.Archived), // 15
        new Word('eight', journalId1, [4, 5, 6], GroupDisplayMode.Archived), // 16

        new Word('bedroom', journalId1, [5]), // 17
        new Word('therapeutic', journalId1, [5, 2]), // 18
        new Word('numerous', journalId1, [5, 3]), // 19
        new Word('mushy', journalId1, [5, 4], GroupDisplayMode.Archived), // 20
        new Word('owe', journalId1, [5]), // 21

        new Word('freezing', journalId1, [6]), // 22
        new Word('second', journalId1, [6]), // 23
        new Word('unbiased', journalId1, [6]), // 24
        new Word('party', journalId1, [6]), // 25

        new Word('company', journalId2, [7, 8]), // 26
        new Word('parent', journalId2, [8]) // 27
    ]);

    const wordsInGroupsMap: [number, number][] = [
        [1, 2],
        [2, 2],
        [3, 2],
        [4, 2],
        [5, 2],
        [5, 3],
        [5, 5],
        [5, 6],
        [6, 2],
        [6, 3],
        [6, 4],
        [6, 5],
        [6, 6],
        [7, 3],
        [8, 3],
        [9, 3],
        [10, 3],
        [11, 3],
        [12, 4],
        [13, 4],
        [13, 3],
        [14, 4],
        [14, 6],
        [15, 4],
        [15, 6],
        [16, 4],
        [16, 5],
        [16, 6],
        [17, 5],
        [18, 5],
        [18, 2],
        [19, 5],
        [19, 3],
        [20, 5],
        [20, 4],
        [21, 5],
        [22, 6],
        [23, 6],
        [24, 6],
        [25, 6],
        [26, 7],
        [26, 8],
        [27, 8]
    ];

    await db.wordsInGroups.bulkAdd(wordsInGroupsMap.map(args => new WordInGroup(...args)));

    // });
}

// TODO: testing SZ
// rePopulate(db);

/**
 * Get all word ids belonging to the specified group.
 *
 * @param {number} groupId
 * @returns {Promise<number[]>}
 */
export async function getGroupWordIds(groupId: number): Promise<number[]> {
    return await db.wordsInGroups
        .where({ groupId })
        .primaryKeys()
        .then(wordAndGroupIds => wordAndGroupIds.map(([wordId]) => wordId));
}

export async function getWordGroupIds(wordId: number): Promise<number[]> {
    return await db.wordsInGroups
        .where({ wordId })
        .primaryKeys()
        .then(wordAndGroupIds => wordAndGroupIds.map(([, groupId]) => groupId));
}

export async function putWordInGroup(wordId: number, groupId: number, journalId: number): Promise<void> {
    await db.transaction('rw', db.wordsInGroups, db.words, db.groups, async () => {
        if (!(await isValidDBCommonEntry(db.words, { id: wordId, journalId })))
            throw new Error(`db/putWordInGroup: Invalid word id #${wordId}.`);

        if (!(await isValidDBCommonEntry(db.groups, { id: groupId, journalId })))
            throw new Error(`db/putWordInGroup: Invalid group id #${wordId}.`);

        await db.wordsInGroups.put(new WordInGroup(wordId, groupId));
    });
}

export async function deleteWordInGroup(wordId: number, groupId: number): Promise<void> {
    await db.transaction('rw', db.wordsInGroups, async () => {
        await db.wordsInGroups.where({ wordId, groupId }).delete();
    });
}

// export async function isValidEntry<K extends DBEntry>(id: number, table: Table<K>): Promise<boolean> {
//     console.log('11', id);

//     const entry = await table.get(id);

//     console.log('11', id, entry?.id);
//     return entry !== undefined;
// }

export async function isValidDBCommonEntry(table: Table, condition: { [key: string]: any }): Promise<boolean> {
    return (await table.where(condition).count()) === 1;
}

// /**
//  * Get word count of the specified group based on the provided group display mode.
//  *
//  * @export
//  * @param {number} groupId
//  * @param {*} [displayMode=GroupDisplayMode.All]
//  * @returns {Promise<number>}
//  */
// export async function getGroupWordCount(groupId: number, displayMode = GroupDisplayMode.All): Promise<number> {
//     if (!(await isValidEntry(groupId, db.groups)))
//         throw new Error(`db/getGroupWordCount: Invalid group id #${groupId}.`);

//     return db.transaction('r', db.wordsInGroups, async () => {
//         const wordIds = await getGroupWordIds(groupId);

//         if (displayMode === GroupDisplayMode.All) {
//             return wordIds.length;
//         }

//         return db.words
//             .where('id')
//             .anyOf(wordIds)
//             .filter(word => word.isArchived === displayMode)
//             .count();
//     });
// }

// /**
//  * Get words belonging to the specified group based on the provided group display mode.
//  *
//  * @export
//  * @param {number} groupId
//  * @param {*} [displayMode=GroupDisplayMode.All]
//  * @returns {Promise<Word[]>}
//  */
// export async function getGroupWords(groupId: number, displayMode = GroupDisplayMode.All): Promise<Word[]> {
//     if (!(await isValidEntry(groupId, db.groups))) throw new Error(`db/getGroupWords: Invalid group id #${groupId}.`);

//     return db.transaction('r', db.wordsInGroups, async () => {
//         const wordIds = await getGroupWordIds(groupId);

//         if (displayMode === GroupDisplayMode.All) {
//             return db.words.bulkGet(wordIds);
//         }

//         return db.words
//             .where('id')
//             .anyOf(wordIds)
//             .filter(word => word.isArchived === displayMode)
//             .toArray();
//     });
// }

// /**
//  * Get all word ids belonging to the specified group.
//  *
//  * @param {number} groupId
//  * @returns {Promise<number[]>}
//  */
// async function getGroupWordIds(groupId: number): Promise<number[]> {
//     return await db.wordsInGroups
//         .where({ groupId })
//         .primaryKeys()
//         .then(wordAndGroupIds => wordAndGroupIds.map(([wordId]) => wordId));
// }

/* export async function getWordGroupCount(wordId: number): Promise<number> {
    if (!(await isValidEntry(wordId, db.groups))) throw new Error(`db/getWordGroupCount: Invalid word id #${wordId}.`);

    return db.wordsInGroups.where({ wordId }).count();
} */

/* export async function getWordGroups(wordId: number): Promise<Group[]> {
    if (!(await isValidEntry(wordId, db.groups))) throw new Error(`db/getWordGroups: Invalid word id #${wordId}.`);

    return db.transaction('r', db.wordsInGroups, async () => {
        const groupIds = await db.wordsInGroups
            .where({ wordId })
            .primaryKeys()
            .then(wordAndGroupIds => wordAndGroupIds.map(([, groupId]) => groupId));

        return db.groups.bulkGet(groupIds);
    });
} */

export { db };
