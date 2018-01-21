import uniqid from 'uniqid';
import moment from 'moment';

import { Word } from './../words';

/*

fetchCollection()
    fetchedCollection = (await gists.get<WordsState>(
            gistIdSetting.get(),
            gistFileNameSetting.get()
        ))

    mutations.populateCollection(context.state, {
        lists: fetchedCollection.lists,
        listTree: fetchCollection.listTree,
        defaultListId: fetchCollection.defaultListId
    });
*/

export interface CollectionState {
    lists: WordList[];
    tree: ListTree[];
    defaultListId: string | null;

    selectedLists: WordList[];
    selectedWords: Word[];
}

export class WordList {
    id: string;
    name: string;
    dateAdded: number;

    pin: boolean = false;
    hidden: boolean = false;
    colour: string = '#fff';

    sortBy: 'name' | 'date' = 'name';
    sortDirection: 'asc' | 'des' = 'asc';

    words: Word[] = [];
    notes: string = '';
    /**
     * Creates an instance of WordList.
     * fsdfsdf
     * @param {string} name
     * @memberof WordList
     */
    constructor(name: string) {
        this.id = uniqid.time();
        this.name = name;
    }
}

export class ListTree {
    wordListId: string;
    items: ListTree[];

    constructor(wordList: WordList) {
        this.wordListId = wordList.id;
        this.items = [];
    }
}

class RootCollection {
    defaultWordList: string;
    structure: ListTree[] = [];
    lists: WordList[];

    constructor() {
        const defaultWordList = new WordList('blah');
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
            wordListId: 'one',
            items: [
                {
                    wordListId: 'two',
                    items: []
                }
            ]
        }
    ]
};

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
