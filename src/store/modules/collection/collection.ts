import { ActionContext } from 'vuex';

import storage from '@/api/storage';
import {
    CollectionState,
    CollectionIndex,
    CollectionList,
    CollectionTree,
    CollectionWord,
    CollectionListMap,
    LookupResult
} from './collection-state';
import { RootState } from '@/store/state';
import { isArray } from 'util';

import Fuse from 'fuse-js-latest';

type CollectionContext = ActionContext<CollectionState, RootState>;

const state: CollectionState = new CollectionState();

export enum Action {
    performLookup = 'performLookup',

    addWord = 'addWord',
    deleteWord = 'deleteWord',
    moveWord = 'moveWord'
}

export enum Mutation {
    SET_LIST_NAME = 'SET_LIST_NAME',
    DELETE_LIST = 'DELETE_LIST',

    SET_WORD_TEXT = 'SET_WORD_TEXT',
    DELETE_WORD = 'DELETE_WORD',
    SELECT_WORD = 'SELECT_WORD',
    DESELECT_ALL_WORDS = 'DESELECT_ALL_WORDS',

    SET_LOOKUP_VALUE = 'SET_LOOKUP_VALUE',
    SET_LOOKUP_RESULTS = 'SET_LOOKUP_RESULTS'
}

const getters = {
    getPooledWords(state: CollectionState): CollectionWord[] {
        if (state.selectedLists.length === 0) {
            return [];
        }

        console.log('update tppool', state.selectedLists[0]);

        const pooledWords = (<CollectionWord[]>[]).concat(
            ...state.selectedLists.map(list =>
                // list.index.map(wordId => list.words.get(wordId)!)
                list.index.map(wordId => list.words[wordId]!)
            )
        );

        return pooledWords;
        // return state.selectedLists[0].index;

        /* const pooledWords = (<CollectionWord[]>[]).concat(
            ...state.selectedLists.map(list => Array.from(list.words.values()))
        );

        return pooledWords; */

        /* state.selectedLists.reduce((pooledWords: CollectionWord[], selectedList: CollectionList) => {
            return pooledWords.concat(selectedList.words)
        },[]); */
    }
};

const actions = {
    // #region EDIT INDEX

    async fetchIndex(context: CollectionContext): Promise<void> {
        let index: CollectionIndex = state.index;
        let lists: CollectionListMap = state.lists;

        const hasCollection = await storage.hasCollection();

        if (!hasCollection) {
            actions.addList(context, new CollectionList());
            actions.writeCollection(context);
        } else {
            ({ index, lists } = await storage.loadCollection());
        }

        context.commit('SET_INDEX', index);
        context.commit('SET_LISTS', lists);

        if (state.index.defaultListId === null) {
            return;
        }

        //const defaultList = state.lists.get(state.index.defaultListId);
        const defaultList = state.lists[state.index.defaultListId];
        if (defaultList === undefined) {
            return;
        }

        context.commit('SELECT_LIST', { list: defaultList });
    },

    writeCollection(context: CollectionContext): void {
        storage.saveCollection(state);
    },

    writeIndex(context: CollectionContext): void {
        storage.saveIndex(state.index);
    },

    /**
     *
     *
     * @param {CollectionContext} context
     * @param {(string | string[])} listId
     * @param {boolean} [writeIndex=false] if `true`, the collection index will be written as well
     */
    writeList(context: CollectionContext, listId: string | string[]): void {
        if (isArray(listId)) {
            listId.forEach(lId => _writeList(lId));
        } else {
            _writeList(listId);
        }

        function _writeList(lId: string) {
            // const list = state.lists.get(lId);
            const list = state.lists[lId];
            if (!list) {
                return;
            }

            storage.saveList(list as CollectionList);
        }
    },

    /**
     * Updates the existing index tree with the supplied, new index tree.
     *
     * @param {CollectionContext} context
     * @param {{ tree: CollectionTree }} { tree }
     */
    setIndexTree(context: CollectionContext, { tree }: { tree: CollectionTree }): void {
        context.commit('SET_INDEX_TREE', { tree });
        actions.writeIndex(context);
    },

    addList(context: CollectionContext, list: CollectionList): void {
        // context.commit('ADD_LIST', { tree: state.index.tree, list });
        context.commit('ADD_LIST', {
            tree: state.index.tree,
            list
        });

        // if this is a first list added, make it default
        if (!state.index.defaultListId) {
            context.commit('SET_INDEX_DEFAULT_LIST', { list });
        }

        actions.writeList(context, list.id);
        actions.writeIndex(context);
    },

    deleteList(context: CollectionContext, { listId }: { listId: string }): void {
        const list = state.lists[listId];
        if (!list) {
            return;
        }

        const { parentTree } = helpers.findTree(context, listId);
        if (!parentTree) {
            return;
        }

        console.log('deleteList', list, parentTree);

        // remove the list from the index first
        context.commit(Mutation.DELETE_LIST, { list, tree: parentTree });
        storage.deleteList(listId);

        // check if there are any orphaned lists left and remove them as well
        const flatTree = state.index.flatTree;

        Object.keys(state.lists).forEach(listId => {
            if (flatTree.includes(listId)) {
                return;
            }

            storage.deleteList(listId);
        });

        actions.writeIndex(context);
    },

    setIndexDefaultList(context: CollectionContext, { listId }: { listId: string }): void {
        if (state.index.defaultListId === listId) {
            return;
        }

        const list = state.lists[listId];
        if (!list) {
            return;
        }

        context.commit('SET_INDEX_DEFAULT_LIST', { list });
        actions.writeIndex(context);
    },

    setIndexExpandedTree(context: CollectionContext, { listId, value }: { listId: string; value: boolean }): void {
        const stack: CollectionTree[] = [];
        let tree: CollectionTree | undefined = undefined;

        stack.push.apply(stack, state.index.tree.items);

        while (stack.length !== 0) {
            const node = stack.pop()!;

            if (node.listId === listId) {
                tree = node;
                break;
            }

            if (node.items.length !== 0) {
                stack.push.apply(stack, node.items.slice().reverse());
            }
        }

        if (!tree) {
            return;
        }

        context.commit('SET_INDEX_EXPANDED_TREE', { tree, value });
        actions.writeIndex(context);
    },

    /**
     * Add the specified list to the `selectedLists` array; if the list is already selected, it will be removed from the selection.
     * When appending, already selected lists will not be deselected.
     *
     * @param {CollectionContext} context
     * @param {{ listId: string; append: boolean }} {listId, append  = false}
     * @returns
     */
    selectList(
        context: CollectionContext,
        { listId, append = false, value }: { listId: string; append: boolean; value?: boolean }
    ) {
        if (!append) {
            context.commit('DESELECT_ALL_LISTS');
        }

        const list = state.lists[listId];
        if (!list) {
            return;
        }

        context.commit('SELECT_LIST', { list, value });
        context.dispatch(Action.performLookup);
    },

    deselectAllLists(context: CollectionContext): void {
        context.commit('DESELECT_ALL_LISTS');
    },

    // #endregion EDIT INDEX

    // #region EDIT LIST

    setListName(context: CollectionContext, { listId, value }: { listId: string; value: string }): void {
        const list = state.lists[listId];
        if (!list) {
            return;
        }

        context.commit(Mutation.SET_LIST_NAME, { list, value });

        actions.writeList(context, list.id);
    },

    setListPinned(context: CollectionContext, { listId, value }: { listId: string; value: boolean }): void {
        const list = state.lists[listId];
        if (list === undefined) {
            return;
        }

        context.commit('SET_LIST_PINNED', { list, value });

        actions.writeList(context, list.id);
    },

    [Action.addWord](context: CollectionContext, { listId, word }: { listId: string; word: CollectionWord }): void {
        const list = state.lists[listId];
        if (list === undefined) {
            return;
        }

        context.commit('ADD_WORD', { list, word });

        actions.writeList(context, list.id);
    },

    // TODO: if the defaultListId is invalid, reset the default list to the first list in the tree

    [Action.deleteWord](context: CollectionContext, { wordId }: { wordId: string }): void {
        const { word, list } = helpers.findWord(context, wordId, true);

        if (!word) {
            return;
        }

        context.commit(Mutation.SELECT_WORD, { word, value: false });
        context.commit(Mutation.DELETE_WORD, { list, word });
        actions.writeList(context, list!.id);
    },

    /**
     * Move a word from one list to the other give a word id and the target list id.
     *
     * @param {CollectionContext} context
     * @param {{ wordId: string; listId: string }} { wordId, listId } id of the word to move and id of the list to move the word to
     * @returns {void}
     */
    [Action.moveWord](context: CollectionContext, { wordId, listId }: { wordId: string; listId: string }): void {
        const { word } = helpers.findWord(context, wordId, true);
        const toList = context.state.lists[listId];

        if (!toList || !word) {
            return;
        }

        context.dispatch(Action.deleteWord, { wordId });
        context.dispatch(Action.addWord, { word, listId: toList.id });
    },

    /**
     * Deletes all currently selected words from the corresponding lists.
     *
     * @param {CollectionContext} context
     */
    deleteSelectedWords(context: CollectionContext): void {
        type AggregatedLists = { [name: string]: { list: CollectionList; words: CollectionWord[] } };

        // map selected words to their corresponding lists, so each lists can be processed in turn
        const lists = state.selectedWords.reduce<AggregatedLists>((map, { id }) => {
            const { word, list } = helpers.findWord(context, id);
            if (!word || !list) {
                return map;
            }

            if (!map[list.id]) {
                map[list.id] = { list, words: [] };
            }

            map[list.id].words.push(word);

            return map;
        }, {});

        Object.values(lists).forEach(({ list, words }) => {
            words.forEach(word => {
                context.commit(Mutation.SELECT_WORD, { word, value: false });
                context.commit(Mutation.DELETE_WORD, { list, word });
            });
            actions.writeList(context, list.id);
        });
    },

    // #endregion

    // #region EDIT WORD

    /**
     * Sets the text value of the word with the given wordId.
     *
     * @param {CollectionContext} context
     * @param {{ wordId: string; value: string }} { wordId, value }
     * @returns {void}
     */
    setWordText(
        context: CollectionContext,
        { wordId, value, searchAll }: { wordId: string; value: string; searchAll?: boolean }
    ): void {
        const { word, list } = helpers.findWord(context, wordId, searchAll);
        if (!word) {
            return;
        }

        context.commit(Mutation.SET_WORD_TEXT, { word, value });
        actions.writeList(context, list!.id);
    },

    setWordFavourite(
        context: CollectionContext,
        { wordId, value, searchAll }: { wordId: string; value: string; searchAll?: boolean }
    ): void {
        const { word, list } = helpers.findWord(context, wordId, searchAll);
        if (!word) {
            return;
        }

        context.commit('SET_WORD_FAVOURITE', { word, value });
        actions.writeList(context, list!.id);
    },

    setWordArchived(
        context: CollectionContext,
        { wordId, value, searchAll }: { wordId: string; value: boolean; searchAll?: boolean }
    ): void {
        const { word, list } = helpers.findWord(context, wordId, searchAll);

        if (word == undefined || list == undefined) {
            return;
        }

        context.commit('SET_WORD_ARCHIVED', { word, value });
        actions.writeList(context, list.id);
    },

    /**
     *
     *
     * @param {CollectionContext} context
     * @param {{ wordId: string; append: boolean; value?: boolean; searchAll?: boolean }} { wordId, append = false, value, searchAll }
     * @returns {void}
     */
    selectWord(
        context: CollectionContext,
        {
            wordId,
            append = false,
            value,
            searchAll
        }: { wordId: string; append: boolean; value?: boolean; searchAll?: boolean }
    ): void {
        if (!append) {
            context.commit(Mutation.DESELECT_ALL_WORDS);
        }

        const { word, list } = helpers.findWord(context, wordId, searchAll);

        if (!word) {
            return;
        }

        context.commit(Mutation.SELECT_WORD, { word, value });
    },

    deselectAllWords(context: CollectionContext): void {
        context.commit(Mutation.DESELECT_ALL_WORDS);
    },

    // #endregion

    /**
     *
     *
     * @param {CollectionContext} context
     * @param {{ value: string }} { value }
     */
    // TODO: this is wrong, an action should not be used like this; move this somewhere else
    [Action.performLookup](context: CollectionContext, options?: { value: string }): void {
        const fuseOptions = {
            includeScore: true,
            threshold: 0.4,
            shouldSort: true,
            findAllMatches: true,
            keys: ['text']
        };

        if (!options || options.value === '') {
            context.commit(Mutation.SET_LOOKUP_VALUE, { value: '' });
            context.commit(Mutation.SET_LOOKUP_RESULTS, { results: [] });
            return;
        }

        const { value } = options;

        console.log('perform lookup', options);

        context.commit(Mutation.SET_LOOKUP_VALUE, { value });

        const results = state.index.flatTree.reduce<LookupResult[]>((resultMap, listId) => {
            const list = state.lists[listId];

            const mappedWords = list.index.map(wordId => list.words[wordId]);

            const fuse = new Fuse(mappedWords, fuseOptions);
            const items = fuse
                .search<{ score: number; item: CollectionWord }>(value)
                .map(r => ({ score: r.score, word: r.item }));

            if (items.length === 0) {
                return resultMap;
            }

            resultMap.push({ list, items });

            return resultMap;
        }, []);

        context.commit(Mutation.SET_LOOKUP_RESULTS, { results });
    }
};

const mutations = {
    // #region EDIT INDEX

    SET_INDEX(state: CollectionState, index: CollectionIndex): void {
        state.index = index;
    },

    SET_LISTS(state: CollectionState, lists: CollectionListMap): void {
        state.lists = lists;
    },

    SET_INDEX_DEFAULT_LIST(state: CollectionState, { list }: { list: CollectionList }): void {
        state.index.defaultListId = list.id;
    },

    SET_INDEX_EXPANDED_TREE(state: CollectionState, { tree, value }: { tree: CollectionTree; value: boolean }): void {
        tree.expanded = value;
    },

    SET_INDEX_TREE(state: CollectionState, { tree }: { tree: CollectionTree }) {
        state.index.tree = tree;
    },

    ADD_LIST(state: CollectionState, { tree, list }: { tree: CollectionTree; list: CollectionList }): void {
        state.addList(tree, list);
    },

    SELECT_LIST(state: CollectionState, { list, value }: { list: CollectionList; value?: boolean }): void {
        const index = state.selectedLists.findIndex(selectedList => selectedList.id === list.id);

        // if no value specified, toggle the state of the list
        if (value === undefined) {
            value = index === -1;
        }

        // add a list to the selection, or remove already selected list from the selection
        if (value) {
            state.selectedLists.push(list);
        } else if (index !== -1) {
            // do not remove if it's not in the list; with index === -1, the last item from the list will be removed
            state.selectedLists.splice(index, 1);
        }
    },

    DESELECT_ALL_LISTS(state: CollectionState): void {
        state.selectedLists.splice(0);
    },

    [Mutation.DELETE_LIST](
        state: CollectionState,
        { list, tree }: { list: CollectionList; tree: CollectionTree }
    ): void {
        tree.deleteList(list);
    },

    // #endregion EDIT INDEX

    // #region EDIT LIST

    [Mutation.SET_LIST_NAME](state: CollectionState, { list, value }: { list: CollectionList; value: string }): void {
        list.name = value;
    },

    SET_LIST_PINNED(state: CollectionState, { list, value }: { list: CollectionList; value: boolean }): void {
        list.pinned = value;
    },

    ADD_WORD(state: CollectionState, { list, word }: { list: CollectionList; word: CollectionWord }): void {
        list.addWord(word);
    },

    /**
     * Commits DELETE_WORD mutation.
     *
     * @param {CollectionState} state
     * @param {{ list: CollectionList; word: CollectionWord }} { list, word }
     */
    [Mutation.DELETE_WORD](
        state: CollectionState,
        { list, word }: { list: CollectionList; word: CollectionWord }
    ): void {
        list.deleteWord(word);
    },

    // #endregion

    // #region EDIT WORD

    [Mutation.SET_WORD_TEXT](state: CollectionState, { word, value }: { word: CollectionWord; value: string }): void {
        word.text = value;
    },

    SET_WORD_FAVOURITE(state: CollectionState, { word, value }: { word: CollectionWord; value: boolean }): void {
        word.favourite = value;
    },

    SET_WORD_ARCHIVED(state: CollectionState, { word, value }: { word: CollectionWord; value: boolean }): void {
        word.archived = value;
    },

    SET_WORD_NOTES(state: CollectionState, { word, value }: { word: CollectionWord; value: string }): void {
        word.notes = value;
    },

    [Mutation.SELECT_WORD](state: CollectionState, { word, value }: { word: CollectionWord; value?: boolean }): void {
        const index = state.selectedWords.findIndex(selectedWord => selectedWord.id === word.id);

        // if no value specified, toggle the state of the word
        if (value === undefined) {
            value = index === -1;
        }

        // add a word to the selection, or remove already selected word from the selection
        if (value) {
            state.selectedWords.push(word);
        } else if (index !== -1) {
            // do not remove if it's not in the list; with index === -1, the last item from the list will be removed
            state.selectedWords.splice(index, 1);
        }
    },

    [Mutation.DESELECT_ALL_WORDS](state: CollectionState): void {
        state.selectedWords.splice(0);
    },

    // #endregion

    [Mutation.SET_LOOKUP_VALUE](state: CollectionState, { value }: { value: string }): void {
        state.lookupValue = value;
    },
    [Mutation.SET_LOOKUP_RESULTS](state: CollectionState, { results }: { results: LookupResult[] }): void {
        state.lookupResults = results;
    }
};

const helpers = {
    /**
     * Finds and returns a CollectionWord object (given its id) and its parent CollectionList.
     * By default, searches only in the selected lists.
     *
     * @param {CollectionContext} context context to search in
     * @param {string} wordId word id
     * @param {boolean} [searchAll=false] if true, search the whole collection; slower; defaults to false
     * @returns {({ word: CollectionWord?; list?: CollectionList })}
     */
    findWord(
        context: CollectionContext,
        wordId: string,
        searchAll: boolean = false
    ): { word?: CollectionWord; list?: CollectionList } {
        const listToSearch = searchAll
            ? Object.values(context.state.lists) // get all the lists
            : context.state.selectedLists;

        const list = listToSearch.find(list => list.words[wordId] !== undefined);

        if (!list) {
            return {};
        }

        // the word will be in the found list
        const word = list.words[wordId];

        return { word, list };
    },

    /**
     * Finds and returns the CollectionTree given its id; also returns it direct parent CollectionTree if exists.
     *
     * @param {CollectionContext} context context to search in
     * @param {string} listId list id
     * @returns {{ parentTree?: CollectionTree; listTree?: CollectionTree }}
     */
    findTree(context: CollectionContext, listId: string): { parentTree?: CollectionTree; listTree?: CollectionTree } {
        // create a stack to search through recursively
        const stack: { parent: CollectionTree; list: CollectionTree }[] = [];
        let root: CollectionTree = context.state.index.tree;

        // push to the stack itemo from the top level of the root tree
        stack.push.apply(stack, root.items.map(item => ({ parent: root, list: item })));

        // check if the list in the stack has matching id and return it and its parent
        while (stack.length !== 0) {
            const { list, parent } = stack.pop()!;

            // match found - return
            if (list.listId === listId) {
                return { parentTree: parent, listTree: list };
            }

            // if the tree has children, add them to the stack as well
            if (list.items.length !== 0) {
                stack.push.apply(stack, list.items.map(item => ({ parent: list, list: item })).reverse());
            }
        }

        return {};
    }
};

export const collection = {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
