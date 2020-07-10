import Dexie from 'dexie';

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

export interface DBNonJournalEntry extends DBEntry {
    readonly journalId?: number;
}

export class Journal implements DBEntry {
    readonly id: number;

    constructor(
        public name: string = 'Default Journal',
        public rootGroupId: number = -1,
        public defaultGroupId: number | null = null
    ) {}
}

export class Group implements DBNonJournalEntry {
    readonly id: number;

    constructor(
        public name: string,
        public journalId: number,
        public displayMode: GroupDisplayMode = GroupDisplayMode.All,
        public subGroupIds: number[] = []
    ) {}
}

export class Word implements DBNonJournalEntry {
    readonly id: number;

    constructor(
        public text: string,
        public journalId: number,
        public memberGroupIds: number[] = [],
        public isArchived: WordArchived = GroupDisplayMode.Active
    ) {}
}

export class WordPouch extends Dexie {
    // Declare implicit table properties.
    // (just to inform Typescript. Instantiated by Dexie in stores() method)
    journals: Dexie.Table<Journal, number>; // number = type of the primary key
    groups: Dexie.Table<Group, number>;
    words: Dexie.Table<Word, number>;

    // NOTE: maybe it will be worth to use many-to-many junction for words-in-group as described here: https://github.com/dfahlander/Dexie.js/issues/815

    constructor() {
        super('word-pouch');
        this.version(1).stores({
            // A compound index cannot be marked MultiEntry. The limitation lies within indexedDB itself. :/
            journals: '++id, name, rootGroupId',
            groups: '++id, journalId, name, displayMode, *subGroupIds',
            words: '++id, journalId, text, isArchived, *memberGroupIds'
        });

        this.journals.mapToClass(Journal);
        this.journals.mapToClass(Group);
        this.journals.mapToClass(Word);
    }
}

const db = new WordPouch();

export { db };

// pack, deck, collection, list, trove, stash, lexicon, dictionary, wordstock, diction, journal, binder
// base, hub, site,
// lexicon
// journal/bundle/section?/story/branch?/bough
// word
// journals/groups/words
