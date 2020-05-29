import uniqid from 'uniqid';
import moment from 'moment';

// backup
interface CollectionBackup {
    id: string;
    defaultListId: string;

    tree: []; // listIds of the first level

    words: {
        //
    };

    lists: {
        istId: {
            // blah
            items: []; // listIds of this list
        };

        //
    };
}

interface nIndex {
    id: string;
    defaultListId: string;

    tree: []; // listIds of the first level

    wordsIds: []; // list of all wordIds in the collection

    listIds: []; // list of all listIds in the collection
}

interface nWord {}

interface nList {
    tree: []; // listIds of the first level
}

interface newState {
    id: string;
    defaultListId: string;
}

/**
 * A result of the word lookup in the entire collection.
 *
 * @export
 * @interface LookupResult
 */
export interface LookupResult {
    /**
     * A list in which some of matches were found.
     *
     * @type {CollectionList}
     * @memberof LookupResult
     */
    list: CollectionList;

    /**
     * Word matches found during the word lookup.
     *
     * @type {{score: number, word: CollectionWord}[]}
     * @memberof LookupResult
     */
    items: { score: number; word: CollectionWord }[];
}

export type CollectionListMap = { [name: string]: CollectionList };

export enum CollectionDisplay {
    all = 0,
    active = 1,
    archived = 2,
    mixed = -1
}

export enum CollectionSortBy {
    name = 'name',
    date = 'date'
}

export enum CollectionSortDirection {
    ascending = 'asc',
    descending = 'des'
}

export interface CollectionStateOptions {}

export namespace CollectionState {
    export interface Untyped {
        index?: CollectionIndex;
        lists?: CollectionListMap;
    }
}

export class CollectionState {
    index: CollectionIndex;

    /**
     * A map of all the lists in the collection in the form of `{ [name: string]: CollectionList }`.
     *
     * @type {CollectionListMap}
     * @memberof CollectionState
     */
    lists: CollectionListMap;

    readonly selectedLists: CollectionList[] = [];
    readonly selectedWords: CollectionWord[] = [];

    lookupValue: string = '';
    lookupResults: LookupResult[] = [];

    constructor(options: CollectionState.Untyped = {}) {
        const { index = new CollectionIndex(), lists = {} } = options;

        this.index = index;
        this.lists = lists;
    }

    // TODO: remove this function - move to the collection ADD_LIST function
    /* addList_(tree: CollectionTree, list: CollectionList): void {
        tree.addList_(list);
        this.lists[list.id] = list;
        //this.lists.set(list.id, list);
    } */
}

export interface CollectionIndexOptions {
    id?: string;
    defaultListId?: string | null;
    tree?: CollectionTree;
    dateCreated?: number;
    dateModified?: number;
    words?: CollectionWordMap;
}

export class CollectionIndex {
    readonly id: string;
    defaultListId: string | null;

    tree: CollectionTree;
    words: CollectionWordMap;

    readonly dateCreated: number;
    dateModified: number;

    constructor(options: CollectionIndexOptions = {}) {
        const {
            id = uniqid.time(),
            defaultListId = null,
            tree = {},
            words = {},
            dateCreated = moment.now(),
            dateModified = moment.now()
        } = options;

        this.id = id;
        this.defaultListId = defaultListId;
        this.tree = new CollectionTree(tree, this);
        this.dateCreated = dateCreated;
        this.dateModified = dateModified;

        // convert word dictionary into a proper Map of CollectionWord object
        // type words in the dictionary
        this.words = words;
        /* this.words = Object.values(words).reduce((map: CollectionWordMap, wordOptions: CollectionWordOptions) => {
            const word = new CollectionWord(wordOptions);
            map[word.id] = word;
            return map;
        }, {}); */
    }

    /* set tree(value: CollectionTree) {
        this._tree = value;
        this.update();
    }

    get tree(): CollectionTree {
        return this._tree;
    } */

    /* set words(value: CollectionWordMap) {
        this._words = value;
        this.update();
    }

    get words(): CollectionWordMap {
        return this._words;
    } */

    /* deleteWord_(word: CollectionWord): void {
        delete this.words[word.id];
        this.update();
    }

    addWord_(word: CollectionWord): void {
        this.words[word.id] = word;
        this.update();
    } */

    /**
     * Checks if the word (by the text) already exist in the collection.
     *
     * // TODO: use `doesExist` function in the collection instead, I think
     * @param {string} text
     * @returns {boolean}
     * @memberof CollectionIndex
     */
    /* hasWord_(text: string): boolean {
        return Object.values(this.words).some(word => word.text === text);
    }

    getWord_(text: string): CollectionWord | undefined {
        return Object.values(this.words).find(word => word.text === text);
    } */

    /* set defaultListId(value: string | null) {
        this._defaultListId = value;
        this.update();
    }

    get defaultListId(): string | null {
        return this._defaultListId;
    } */

    /**
     * Returns a flattened collection tree.
     *
     * @readonly
     * @type {string[]}
     * @memberof CollectionIndex
     */
    get flatTree(): string[] {
        /* Pre-order tree traversal visits each node using stack.
        Checks if leaf node based on children === null otherwise
        pushes all children into stack and continues traversal. */

        const stack: CollectionTree[] = [];
        const array: string[] = []; // output

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
        /* const safeWords = Object.values(this.words).reduce((map: { [name: string]: CollectionWordOptions }, word: CollectionWord, {}) => {
            map[word.id] = word.safeJSON;
            return map;
        }, {}); */

        return {
            id: this.id,
            defaultListId: this.defaultListId,
            tree: this.tree.safeJSON as CollectionTree,
            words: this.words, // safeWords as CollectionWordMap,
            dateCreated: this.dateCreated,
            dateModified: this.dateModified
        };
    }
}

export interface CollectionTreeOptions {
    listId?: string;
    items?: CollectionTree[];
    expanded?: boolean;
}

export class CollectionTree {
    listId: string;
    items: CollectionTree[];
    expanded: boolean;

    private root: CollectionIndex;

    constructor(options: CollectionTreeOptions = {}, root: CollectionIndex) {
        const { listId = `I'm root`, items = [], expanded = true } = options;

        this.listId = listId;
        this.items = items.map(item => new CollectionTree(item, root));
        this.expanded = expanded;

        this.root = root;
    }

    /* addList_(list: CollectionList): void {
        this.items.push(new CollectionTree({ listId: list.id }, this.root));
        this.update();
    } */

    /* deleteList_(list: CollectionList): void {
        const index = this.items.findIndex(item => item.listId === list.id);
        if (index === -1) {
            return;
        }

        this.items.splice(index, 1);
        this.update();
    } */

    /* get expanded(): boolean {
        return this._expanded;
    }

    set expanded(value: boolean) {
        this._expanded = value;
    } */

    update(): void {
        this.root.update();
    }

    get safeJSON(): CollectionTreeOptions {
        return {
            listId: this.listId,
            expanded: this.expanded,
            items: this.items.map(item => item.safeJSON) as CollectionTree[]
        };
    }
}

export type CollectionWordMap = { [name: string]: CollectionWord };

export interface CollectionIndex_ {
    id: string;
    defaultListId: string | null; // TODO: should not be an undefined, maybe an explicit null value

    tree: CollectionTree;
    words: CollectionWordMap;

    dateCreated: number;
}

export interface CollectionTree_ {
    listId: string;
    expanded: boolean;
    items: CollectionTree_[];
}

/**
 * Represents a list in the collection.
 *
 * @export
 * @interface CollectionList
 */
export interface CollectionList {
    id: string;

    name: string;
    index: string[];

    display: CollectionDisplay; // TODO: rename to `displayMode`
    pinned: boolean;
    hidden: boolean;
    sortBy: CollectionSortBy;
    sortDirection: CollectionSortDirection;
    notes: string;

    /**
     * The date when the CollectionWord was added to the collection.
     *
     * @type {number}
     * @memberof CollectionList
     */
    dateCreated: number;
}

/**
 * Represents a word in the collection.
 *
 * @export
 * @interface CollectionWord
 */
export interface CollectionWord {
    /**
     * The id of the CollectionWord.
     *
     * @type {string}
     * @memberof CollectionWord
     */
    id: string;

    /**
     * The text value of the CollectionWord.
     *
     * @type {string}
     * @memberof CollectionWord
     */
    text: string;
    /**
     * The archived flag. Archived words can be hidden from view.
     *
     * @type {boolean}
     * @memberof CollectionWord
     */
    archived: boolean;
    /**
     * Notes about this CollectionWord.
     *
     * @type {string}
     * @memberof CollectionWord
     */
    notes: string;

    /**
     * The date when the CollectionWord was added to the collection.
     *
     * @type {number}
     * @memberof CollectionWord
     */
    dateAdded: number;
}

/**
 * A set of factory functions for the Collection State.
 */
export const collectionFactory = {
    /**
     * Creates and returns a new CollectionWord given its text value.
     *
     * @param {string} text
     * @returns {CollectionWord}
     */
    CollectionWord(text: string): CollectionWord {
        return {
            id: uniqid.time(),
            text,
            archived: false,
            notes: '',
            dateAdded: moment.now()
        };
    },

    /**
     * Creates and returns a new CollectionList.
     *
     * @returns {CollectionList}
     */
    CollectionList(): CollectionList {
        return {
            id: uniqid.time(),
            name: 'Untitled List',
            index: [],
            display: CollectionDisplay.all,
            pinned: false,
            hidden: false,
            sortBy: CollectionSortBy.name,
            sortDirection: CollectionSortDirection.ascending,
            notes: '',
            dateCreated: moment.now()
        };
    } /* ,

    CollectionIndex(): CollectionIndex {
        return {
            id: uniqid.time(),

            tree: {},
            words: {},

            dateCreated: moment.now()
        };
    } */
};
