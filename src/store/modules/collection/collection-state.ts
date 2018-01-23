import uniqid from 'uniqid';
import moment from 'moment';

import { Word } from './../words';

import electron from 'electron';

// remote module has a limitation which prevents preventing the close event
// see https://github.com/electron/electron/issues/4473 and https://github.com/electron/electron/issues/3362
electron.remote.getCurrentWindow().on('close', event => {
    console.log('current windwo', event);
    /* event.stopImmediatePropagation();
    event.stopPropagation(); */
    event.returnValue = false;
    event.preventDefault();
});

window.onbeforeunload = e => {
    console.log('I do not want to be closed');

    // Unlike usual browsers that a message box will be prompted to users, returning
    // a non-void value will silently cancel the close.
    // It is recommended to use the dialog API to let the user confirm closing the
    // application.
    // e.returnValue = false;
};

export interface CollectionState {
    index: CollectionIndex;
    lists: CollectionList[];

    selectedLists: CollectionList[];
    selectedWords: Word[];
}

export interface CollectionIndex {
    defaultListId: string | null;

    tree: ListTree[];
}

export class CollectionList {
    id: string;
    name: string;
    readonly dateCreated: number;

    pin: boolean = false;
    hidden: boolean = false;
    colour: string = '#fff';

    sortBy: 'name' | 'date' = 'name';
    sortDirection: 'asc' | 'des' = 'asc';

    readonly words: Word[] = [];
    notes: string = '';

    constructor(name: string) {
        this.id = uniqid.time();
        this.name = name;
        this.dateCreated = moment.now();

        this.words.push(new Word({ text: 'dfs' }));
        this.words = [];
    }
}

export class ListTree {
    listId: string;
    items: ListTree[];

    constructor(list: CollectionList) {
        this.listId = list.id;
        this.items = [];
    }
}
/* 
class RootCollection {
    defaultWordList: string;
    structure: ListTree[] = [];
    lists: CollectionList[];

    constructor() {
        const defaultWordList = new CollectionList('blah');
        const listTree = new ListTree(defaultWordList);

        this.lists.push(defaultWordList);
        this.structure.push(listTree);
    }
}

const a: RootCollection = {
    defaultWordList: '',
    lists: [],
    structure: [
        {
            listId: 'one',
            items: [
                {
                    listId: 'two',
                    items: []
                }
            ]
        }
    ]
}; */

/*

- load collection hierarchy
- renderd hierarchy
- load default-selected list
- render list items




*/

/* function moveList(
    list: WordList,
    target: WordList,
    targetIndex: number
): void {} */

/* listId  parentListId    index
one     two             2
two     three           3
four    five            4 */
