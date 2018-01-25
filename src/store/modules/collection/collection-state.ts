import uniqid from 'uniqid';
import moment from 'moment';

import { Word } from './../words';

import electron from 'electron';
import WordList from '../../../components/editor/word-editor.vue';

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

interface CollectionStateOptions {
    index?: CollectionIndex;
    lists?: CollectionList[];

    selectedLists?: CollectionList[];
    selectedWords?: Word[];
}

export class CollectionState {
    index: CollectionIndex;
    lists: CollectionList[];

    readonly selectedLists: CollectionList[];
    readonly selectedWords: Word[];

    constructor(options: CollectionStateOptions = {}) {
        const {
            index = new CollectionIndex(),
            lists = [],
            selectedLists = [],
            selectedWords = []
        } = options;

        this.index = index;
        this.lists = lists;
        this.selectedLists = selectedLists;
        this.selectedWords = selectedWords;
    }
}

interface CollectionIndexOptions {
    defaultListId?: string | null;
    tree?: ListTree;
    dateCreated?: number;
    dateModified?: number;
}

export class CollectionIndex {
    protected _defaultListId: string | null;

    readonly tree: ListTree;

    readonly dateCreated: number;
    dateModified: number;

    constructor(options: CollectionIndexOptions = {}) {
        const {
            defaultListId = null,
            tree = {},
            dateCreated = moment.now(),
            dateModified = moment.now()
        } = options;

        this.defaultListId = defaultListId;
        this.tree = new ListTree(tree, this);
        this.dateCreated = dateCreated;
        this.dateModified = dateModified;
    }

    set defaultListId(value: string | null) {
        this._defaultListId = value;
        this.update();
    }

    update(): void {
        this.dateModified = moment.now();
    }
}

interface ListTreeOptions {
    listId?: string;
    items?: ListTree[];
}

export class ListTree {
    readonly listId: string;
    readonly items: ListTree[];

    readonly root: CollectionIndex;

    constructor(options: ListTreeOptions = {}, root: CollectionIndex) {
        const { listId = `I'm root`, items = [] } = options;

        this.listId = listId;
        this.items = items.map(item => new ListTree(item, root));
        this.root = root;
    }

    addList?(list: CollectionList): void {
        this.items.push(new ListTree({ listId: list.id }, this.root));
        this.root.update();
    }

    removeList(list: CollectionList): void {
        // TODO: implement
    }
}

type SortBy = 'name' | 'date';
type SortDirection = 'asc' | 'des';

interface CollectionListOptions {
    readonly id?: string;
    name?: string;
    readonly dateCreated?: number;
    dateModified?: number;

    pin?: boolean;
    hidden?: boolean;
    colour?: string;

    sortBy?: SortBy;
    sortDirection?: SortDirection;

    readonly words?: Word[];
    notes?: string;
}

export class CollectionList {
    readonly id: string;
    private _name: string;
    readonly dateCreated: number;
    dateModified: number;

    private _pin: boolean;
    private _hidden: boolean;
    private _colour: string;

    private _sortBy: SortBy;
    private _sortDirection: SortDirection;

    readonly words: Word[];
    private _notes: string;

    constructor(options: CollectionListOptions = {}) {
        const {
            id = uniqid.time(),
            name = 'dog-guts',
            dateCreated = moment.now(),
            dateModified = moment.now(),
            pin = false,
            hidden = false,
            colour = '#fff',
            sortBy = 'name',
            sortDirection = 'asc',
            words = [],
            notes = ''
        } = options;

        this.id = id;
        this.name = name;
        this.dateCreated = dateCreated;
        this.dateModified = dateModified;
        this.pin = pin;
        this.hidden = hidden;
        this.colour = colour;
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
        this.words = words;
        this.notes = notes;
    }

    /**
     * List name as displayed in the Collection view.
     *
     * @memberof CollectionList
     */
    set name(value: string) {
        this._name = value;
        this.update();
    }

    set pin(value: boolean) {
        this._pin = value;
        this.update();
    }

    set hidden(value: boolean) {
        this._hidden = value;
        this.update();
    }

    set colour(value: string) {
        this._colour = value;
        this.update();
    }

    set sortBy(value: SortBy) {
        this._sortBy = value;
        this.update();
    }

    set sortDirection(value: SortDirection) {
        this._sortDirection = value;
        this.update();
    }

    set notes(value: string) {
        this._notes = value;
        this.update();
    }

    addWord(word: Word): void {
        this.words.push(word);
        this.update();
    }

    removeWord(word: Word): void {
        // TODO: implement
        this.update();
    }

    private update(): void {
        this.dateModified = moment.now();
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
