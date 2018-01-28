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
    lists?: Map<string, CollectionList>;

    selectedLists?: CollectionList[];
    selectedWords?: CollectionWord[];
}

export class CollectionState {
    index: CollectionIndex;

    lists: Map<string, CollectionList>;

    readonly selectedLists: CollectionList[];
    readonly selectedWords: CollectionWord[];

    constructor(options: CollectionStateOptions = {}) {
        const {
            index = new CollectionIndex(),
            lists = new Map(),
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
    id?: string;
    defaultListId?: string | null;
    tree?: CollectionTree;
    dateCreated?: number;
    dateModified?: number;
}

export class CollectionIndex {
    readonly id: string;
    protected _defaultListId: string | null;

    readonly tree: CollectionTree;

    readonly dateCreated: number;
    dateModified: number;

    constructor(options: CollectionIndexOptions = {}) {
        const {
            id = uniqid.time(),
            defaultListId = null,
            tree = {},
            dateCreated = moment.now(),
            dateModified = moment.now()
        } = options;

        this.id = id;
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

    get flatTree(): string[] {
        /* Pre-order tree traversal visits each node using stack.
        Checks if leaf node based on children === null otherwise
        pushes all children into stack and continues traversal. */

        const stack: CollectionTree[] = [];
        const array: string[] = [];

        stack.push.apply(stack, this.tree.items);

        while (stack.length !== 0) {
            const node = stack.pop()!;

            array.push(node.listId);
            if (node.items.length !== 0) {
                stack.push.apply(stack, node.items.slice().reverse());
            }
        }

        return array;
    }

    update(): void {
        this.dateModified = moment.now();
    }

    get safeJSON(): CollectionIndexOptions {
        return {
            id: this.id,
            defaultListId: this.defaultListId,
            tree: this.tree.safeJSON as CollectionTree,
            dateCreated: this.dateCreated,
            dateModified: this.dateModified
        };
    }
}

export interface CollectionTreeOptions {
    listId?: string;
    items?: CollectionTree[];
}

export class CollectionTree {
    readonly listId: string;
    readonly items: CollectionTree[];

    private root: CollectionIndex;

    constructor(options: CollectionTreeOptions = {}, root: CollectionIndex) {
        const { listId = `I'm root`, items = [] } = options;

        this.listId = listId;
        this.items = items.map(item => new CollectionTree(item, root));

        this.root = root;
    }

    addList(list: CollectionList): void {
        this.items.push(new CollectionTree({ listId: list.id }, this.root));
        this.update();
    }

    removeList(list: CollectionList): void {
        // TODO: implement
    }

    update(): void {
        this.root.update();
    }

    get safeJSON(): CollectionTreeOptions {
        return {
            listId: this.listId,
            items: this.items.map(item => item.safeJSON) as CollectionTree[]
        };
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

    get safeJSON(): CollectionListOptions {
        return {
            id: this.id,
            name: this.name,
            dateCreated: this.dateCreated,
            dateModified: this.dateModified,
            pin: this.pin,
            hidden: this.hidden,
            colour: this.colour,
            sortBy: this.sortBy,
            sortDirection: this.sortDirection,
            words: this.words.map(word => word.safeJSON) as CollectionWord[],
            notes: this.notes
        };
    }
}

export interface CollectionWordOptions {
    id?: string;

    text?: string;
    archived?: boolean;
    favourite?: boolean;
    notes?: string;

    dateAdded?: number;
    dateModified?: number;
}

export class CollectionWord {
    readonly id: string;

    _text: string;
    _archived: boolean;
    _favourite: boolean;
    _notes: string;
    //noteIds: string[];

    readonly dateAdded: number;
    dateModified: number;

    constructor(options: CollectionWordOptions = {}) {
        const {
            id = uniqid.time(),
            text = '',
            archived = false,
            favourite = false,
            notes = '',
            dateAdded = moment.now(),
            dateModified = moment.now()
        } = options;

        this.id = id;
        this.text = text;
        this.archived = archived;
        this.favourite = favourite;
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

    set favourite(value: boolean) {
        this._favourite = value;
        this.update();
    }

    get favourite(): boolean {
        return this._favourite;
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

    get safeJSON(): CollectionWordOptions {
        return {
            id: this.id,
            text: this.text,
            archived: this.archived,
            favourite: this.favourite,
            notes: this.notes,
            dateAdded: this.dateAdded,
            dateModified: this.dateModified
        };
    }
}
