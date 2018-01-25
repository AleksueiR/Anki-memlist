import uniqid from 'uniqid';
import moment from 'moment';

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

// overloading constructors https://stackoverflow.com/a/40976608

export interface CollectionStateOptions {
    index?: CollectionIndex;
    lists?: CollectionList[];

    selectedLists?: CollectionList[];
    selectedWords?: CollectionWord[];
}

export class CollectionState {
    index: CollectionIndex;
    lists: CollectionList[];

    readonly selectedLists: CollectionList[];
    readonly selectedWords: CollectionWord[];

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

export interface CollectionIndexOptions {
    defaultListId?: string | null;
    tree?: CollectionTree;
    dateCreated?: number;
    dateModified?: number;
}

export class CollectionIndex {
    protected _defaultListId: string | null;

    readonly tree: CollectionTree;

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
        this.tree = new CollectionTree(tree, this);
        this.dateCreated = dateCreated;
        this.dateModified = dateModified;
    }

    set defaultListId(value: string | null) {
        this._defaultListId = value;
        this.update();
    }

    get defaultListId(): string | null {
        return this._defaultListId;
    }

    update(): void {
        this.dateModified = moment.now();
    }
}

export interface CollectionTreeOptions {
    listId?: string;
    items?: CollectionTree[];
}

export class CollectionTree {
    readonly listId: string;
    readonly items: CollectionTree[];

    readonly root: CollectionIndex;

    constructor(options: CollectionTreeOptions = {}, root: CollectionIndex) {
        const { listId = `I'm root`, items = [] } = options;

        this.listId = listId;
        this.items = items.map(item => new CollectionTree(item, root));
        this.root = root;
    }

    addList?(list: CollectionList): void {
        this.items.push(new CollectionTree({ listId: list.id }, this.root));
        this.root.update();
    }

    removeList(list: CollectionList): void {
        // TODO: implement
    }
}

export type CollectionSortBy = 'name' | 'date';
export type CollectionSortDirection = 'asc' | 'des';

export interface CollectionListOptions {
    readonly id?: string;
    name?: string;
    readonly dateCreated?: number;
    dateModified?: number;

    pin?: boolean;
    hidden?: boolean;
    colour?: string;

    sortBy?: CollectionSortBy;
    sortDirection?: CollectionSortDirection;

    readonly words?: CollectionWord[];
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

    private _sortBy: CollectionSortBy;
    private _sortDirection: CollectionSortDirection;

    readonly words: CollectionWord[];
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

    get name(): string {
        return this._name;
    }

    set pin(value: boolean) {
        this._pin = value;
        this.update();
    }

    get pin(): boolean {
        return this._pin;
    }

    set hidden(value: boolean) {
        this._hidden = value;
        this.update();
    }

    get hidden(): boolean {
        return this._hidden;
    }

    set colour(value: string) {
        this._colour = value;
        this.update();
    }

    get colour(): string {
        return this._colour;
    }

    set sortBy(value: CollectionSortBy) {
        this._sortBy = value;
        this.update();
    }

    get sortBy(): CollectionSortBy {
        return this._sortBy;
    }

    set sortDirection(value: CollectionSortDirection) {
        this._sortDirection = value;
        this.update();
    }

    get sortDirection(): CollectionSortDirection {
        return this._sortDirection;
    }

    set notes(value: string) {
        this._notes = value;
        this.update();
    }

    get notes(): string {
        return this._notes;
    }

    addWord(word: CollectionWord): void {
        this.words.push(word);
        this.update();
    }

    removeWord(word: CollectionWord): void {
        // TODO: implement
        this.update();
    }

    private update(): void {
        this.dateModified = moment.now();
    }
}

export interface CollectionWordOptions {
    id?: string;

    text?: string;
    archived?: boolean;
    notes?: string;

    dateAdded?: number;
    dateModified?: number;
}

export class CollectionWord {
    readonly id: string;

    _text: string;
    _archived: boolean;
    _notes: string;
    //noteIds: string[];

    readonly dateAdded: number;
    dateModified: number;

    constructor(options: CollectionWordOptions = {}) {
        const {
            id = uniqid.time(),
            text = '',
            archived = false,
            notes = '',
            dateAdded = moment.now(),
            dateModified = moment.now()
        } = options;

        this.id = id;
        this.text = text;
        this.archived = archived;
        this.notes = notes;
        this.dateAdded = dateAdded;
        this.dateAdded = dateModified;
    }

    set text(value: string) {
        this._text = value;
        this.update();
    }

    get text(): string {
        return this._text;
    }

    set archived(value: boolean) {
        this._archived = value;
        this.update();
    }

    get archived(): boolean {
        return this._archived;
    }

    set notes(value: string) {
        this._notes = value;
        this.update();
    }

    get notes(): string {
        return this._notes;
    }

    private update(): void {
        this.dateModified = moment.now();
    }
}
