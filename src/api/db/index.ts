import Dexie, { Table } from 'dexie';

// suppress unhandled rejections
// https://github.com/dfahlander/Dexie.js/issues/729
(Dexie as any).debug = false;

Dexie.delete('word-pouch');

export enum GroupDisplayMode {
    Active = 0,
    Archived = 1,
    All = 2
}

export enum SourceType {
    Builtin = 0,
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
        public isArchived: WordArchived = GroupDisplayMode.Active
    ) {}
}

export class WordInGroup implements DBEntry {
    readonly id: number;

    constructor(public wordId: number, public groupId: number) {}
}

export class Resource implements DBCommonEntry {
    readonly id: number;

    constructor(public name: string, public journalId: number, public type: number, public componentId?: string) {}
}

export class ResourceInGroup implements DBEntry {
    readonly id: number;

    constructor(public resourceId: number, public groupId: number) {}
}

export class Sentence implements DBCommonEntry {
    readonly id: number;

    constructor(public text: string, public journalId: number) {}
}

export class SentenceInResource implements DBEntry {
    readonly id: number;

    constructor(public sentenceId: number, public resourceId: number) {}
}

export class WordPouch extends Dexie {
    // Declare implicit table properties.
    // (just to inform Typescript. Instantiated by Dexie in stores() method)
    journals: Dexie.Table<Journal, number>; // number = type of the primary key
    groups: Dexie.Table<Group, number>;

    words: Dexie.Table<Word, number>;
    wordsInGroups: Dexie.Table<WordInGroup, [number, number]>;

    resources: Dexie.Table<Resource, number>;
    resourcesInGroups: Dexie.Table<ResourceInGroup, [number, number]>;

    sentences: Dexie.Table<Sentence, number>;
    sentencesInResources: Dexie.Table<SentenceInResource, [number, number]>;

    // NOTE: maybe it will be worth to use many-to-many junction for words-in-group as described here: https://github.com/dfahlander/Dexie.js/issues/815

    constructor() {
        super('word-pouch');
        this.version(1).stores({
            // A compound index cannot be marked MultiEntry. The limitation lies within indexedDB itself. :/
            journals: '++id, name, rootGroupId',
            groups: '++id, journalId, [id+journalId], name, displayMode, *subGroupIds',
            words: '++id, journalId, [id+journalId], text, isArchived',
            wordsInGroups: '[wordId+groupId], wordId, groupId',
            resources: '++id, journalId, [id+journalId], name',
            resourcesInGroups: '[resourceId+groupId], resourceId, groupId',
            sentences: '++id, journalId, [id+journalId]',
            sentencesInResources: '[sentenceId+resourceId], &sentenceId, resourceId'
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

// TODO: testing
async function rePopulate(db: WordPouch): Promise<void> {}

// TODO: testing SZ
// rePopulate(db);

export async function isValidDBCommonEntry(table: Table, condition: { [key: string]: any }): Promise<boolean> {
    return (await table.where(condition).count()) === 1;
}

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
            throw new Error(`db/putWordInGroup: Invalid group id #${groupId}.`);

        await db.wordsInGroups.put(new WordInGroup(wordId, groupId));
    });
}

export async function deleteWordInGroup(wordId: number, groupId: number): Promise<void> {
    await db.transaction('rw', db.wordsInGroups, async () => {
        await db.wordsInGroups.where({ wordId, groupId }).delete();
    });
}

//#region - Sentences / Resources

/**
 * Return a list of `Sentence` ids belonging to the specified `Resource`.
 *
 * @export
 * @param {number} resourceId
 * @returns {Promise<number[]>}
 */
export async function getResourceSentenceIds(resourceId: number): Promise<number[]> {
    return await db.sentencesInResources
        .where({ resourceId })
        .primaryKeys()
        .then(sentenceAndResourceIds => sentenceAndResourceIds.map(([sentenceId]) => sentenceId));
}

/**
 * Put a given `Sentence` into the provided `Resource`.
 *
 * @export
 * @param {number} sentenceId
 * @param {number} resourceId
 * @param {number} journalId
 * @returns {Promise<void>}
 */
export async function putSentenceInResource(sentenceId: number, resourceId: number, journalId: number): Promise<void> {
    await db.transaction('rw', db.sentencesInResources, db.sentences, db.resources, async () => {
        if (!(await isValidDBCommonEntry(db.sentences, { id: sentenceId, journalId })))
            throw new Error(`db/putSentenceInResource: Invalid sentence id #${sentenceId}.`);

        if (!(await isValidDBCommonEntry(db.resources, { id: resourceId, journalId })))
            throw new Error(`db/putSentenceInResource: Invalid resource id #${resourceId}.`);

        await db.sentencesInResources.put(new SentenceInResource(sentenceId, resourceId));
    });
}

/**
 * Remove specified `Sentence` from the DB.
 *
 * @export
 * @param {number} sentenceId
 * @returns {Promise<void>}
 */
export async function deleteSentence(sentenceId: number): Promise<void> {
    await db.transaction('rw', db.sentences, db.sentencesInResources, async () => {
        await db.sentences.delete(sentenceId);
        await db.sentencesInResources.where({ sentenceId }).delete();
    });
}

//#endregion - Sentences / Resources

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
