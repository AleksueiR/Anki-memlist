import Dexie from 'dexie';

Dexie.delete('word-pouch');

export function reduceArrayToObject<T extends { [name: string]: any }>(objects: T[], key: string = 'id') {
    return objects.reduce<Record<number, any>>((map, object) => ((map[object[key]] = object), map), {});
}

// pack, deck, collection, list, trove, stash, lexicon, dictionary, wordstock, diction, journal, binder

// lexicon
// journal/bundle/section?/story/branch?/bough
// word

// journals/groups/words

export class WordPouch extends Dexie {
    // Declare implicit table properties.
    // (just to inform Typescript. Instantiated by Dexie in stores() method)
    journals: Dexie.Table<IJournal, number>; // number = type of the primary key
    groups: Dexie.Table<IGroup, number>;
    words: Dexie.Table<IWord, number>;

    constructor() {
        super('word-pouch');
        this.version(1).stores({
            journals: '++id, name, *groupIds',
            // TODO: [journalId+*subGroupIds]
            // A compound index cannot be marked MultiEntry. The limitation lies within indexedDB itself. :/
            groups: '++id, journalId, name, displayMode, *subGroupIds',
            // TODO: [journalId+*memberGroupIds]
            words: '++id, journalId, text, isArchived, *memberGroupIds'
        });
    }
}

// base, hub, site,

export interface IJournal {
    id?: number;
    name: string;
    defaultGroupId: number;
    groupIds: number[];
}

export interface IGroup {
    id?: number;
    journalId: number;
    name: string;
    displayMode: GroupDisplayMode;
    subGroupIds: number[];
}

export interface IWord {
    id?: number;
    journalId: number;
    text: string;
    isArchived: boolean;
    memberGroupIds: number[];
}

export enum GroupDisplayMode {
    all = 0,
    active = 1,
    archived = 2
}

const db = new WordPouch();

export default db;

db.on('populate', () => {
    db.journals
        .add({
            name: 'Default Collection',
            defaultGroupId: -1,
            groupIds: []
        })
        .catch(error => console.log(error));

    db.groups.bulkAdd([
        {
            name: 'list one',
            journalId: 1,
            displayMode: GroupDisplayMode.all,
            subGroupIds: []
        },
        {
            name: 'list two',
            journalId: 1,
            displayMode: GroupDisplayMode.archived,
            subGroupIds: []
        },
        {
            name: 'list three',
            journalId: 1,
            displayMode: GroupDisplayMode.all,
            subGroupIds: []
        }
    ]);
    db.words.bulkAdd([
        { text: 'foo', journalId: 1, isArchived: false, memberGroupIds: [1, 2] },
        { text: 'bar', journalId: 1, isArchived: false, memberGroupIds: [1, 3] },
        { text: 'qyue', journalId: 1, isArchived: false, memberGroupIds: [2, 3] },
        { text: 'queen', journalId: 1, isArchived: false, memberGroupIds: [1] },
        { text: 'king', journalId: 1, isArchived: false, memberGroupIds: [2] }
    ]);
});
db.open();

b();

async function b() {
    const a = await db.words
        .where('memberGroupIds')
        .equals(1)
        .toArray();

    console.log('words', a);

    db.words.get(1).then(async word => {
        const lists = await db.groups
            .where('id')
            .anyOf(word!.memberGroupIds)
            .toArray();
        console.log('lists', lists);
    });

    // const b = await db.words.orderBy('text').keys();
    const b = await db.words
        .where('text')
        .startsWith('f')
        .keys();
    console.log('keys', b);

    const c = await db.words.orderBy('text').toArray();
    console.log(c);

    const d = await db.words
        .filter(word => {
            return word.text === 'foo';
        })
        .toArray();

    console.log('d', d);

    db.groups.where('subGroupIds').equals(1);
}
