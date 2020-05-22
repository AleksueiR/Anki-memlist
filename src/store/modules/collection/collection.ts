import { ActionContext } from 'vuex';

import storage from '@/api/storage';
import {
    CollectionState,
    CollectionIndex,
    CollectionList,
    CollectionTree,
    CollectionWord,
    CollectionListMap,
    LookupResult,
    CollectionDisplay
} from './collection-state';
import { RootState } from '@/store/state';
import { isArray } from 'util';

import Fuse from 'fuse-js-latest';

type CollectionContext = ActionContext<CollectionState, RootState>;

const state: CollectionState = new CollectionState();

export enum Action {
    performLookup = 'performLookup',

    setListDisplay = 'setListDisplay',

    addWord = 'addWord',
    deleteWord = 'deleteWord',
    moveWord = 'moveWord'
}

export enum Mutation {
    SET_LIST_NAME = 'SET_LIST_NAME',
    DELETE_LIST = 'DELETE_LIST',

    SET_WORD_TEXT = 'SET_WORD_TEXT',
    DELETE_WORD_FROM_INDEX = 'DELETE_WORD_FROM_INDEX',
    DELETE_WORD = 'DELETE_WORD',
    SELECT_WORD = 'SELECT_WORD',
    DESELECT_ALL_WORDS = 'DESELECT_ALL_WORDS',

    SET_LOOKUP_VALUE = 'SET_LOOKUP_VALUE',
    SET_LOOKUP_RESULTS = 'SET_LOOKUP_RESULTS',
    SET_INDEX = 'SET_INDEX',
    SET_LISTS = 'SET_LISTS',
    SET_INDEX_DEFAULT_LIST = 'SET_INDEX_DEFAULT_LIST',
    SET_INDEX_EXPANDED_TREE = 'SET_INDEX_EXPANDED_TREE',
    SET_INDEX_TREE = 'SET_INDEX_TREE',
    ADD_LIST = 'ADD_LIST',
    SELECT_LIST = 'SELECT_LIST',
    DESELECT_ALL_LISTS = 'DESELECT_ALL_LISTS',

    SET_LIST_DISPLAY = 'SET_LIST_DISPLAY',
    SET_LIST_PINNED = 'SET_LIST_PINNED',
    ADD_WORD_TO_INDEX = 'ADD_WORD_TO_INDEX',
    ADD_WORD_TO_LIST = 'ADD_WORD_TO_LIST',
    SET_WORD_FAVOURITE = 'SET_WORD_FAVOURITE',
    SET_WORD_ARCHIVED = 'SET_WORD_ARCHIVED',
    SET_WORD_NOTES = 'SET_WORD_NOTES'
}

const getters = {
    /**
     * Returns an accumulated list of words from all the selected list. Words can be filtered by the CollectionDisplay setting.
     *
     * @param {CollectionState} state
     * @returns {CollectionWord[]}
     */
    getPooledWords(state: CollectionState): CollectionWord[] {
        if (state.selectedLists.length === 0) {
            return [];
        }

        // console.log('update pool', state.selectedLists[0]);

        const pooledWords = ([] as CollectionWord[]).concat(
            ...state.selectedLists.map(list =>
                list.index
                    .map(wordId => state.index.words[wordId])
                    .filter(word => {
                        // filter out words according to the collection display setting
                        switch (list.display) {
                            case CollectionDisplay.active:
                                return !word.archived;

                            case CollectionDisplay.archived:
                                return word.archived;

                            default:
                                return true;
                        }
                    })
            )
        );

        // remove duplicates from the set
        return [...new Set(pooledWords)];
    },

    /**
     * Check if the word exists in the whole collection.
     */
    doesExist: (state: CollectionState) => (value: string): boolean => {
        throw new Error();

        /* return Object.values(state.lists).some(list => {
            return Object.values(list.words).some(word => word.text === value);
        }); */
    },

    /**
     * Returns the number of words in a specified list corresponding to the provided display mode.
     * For `mixed` and `all` returns the total count.
     *
     * @param {CollectionDisplay} mode
     * @returns {number}
     * @memberof CollectionList
     */
    countWords: (state: CollectionState) => (listId: string, mode: CollectionDisplay): number => {
        const l = state.lists[listId].index.map(id => state.index.words[id]);

        switch (mode) {
            case CollectionDisplay.active:
                return l.filter(word => !word.archived).length;

            case CollectionDisplay.archived:
                return l.filter(word => word.archived).length;
        }

        return l.length;
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

        // NOTE:  move all words from the lists to the index files;
        // this is only need for old way of storing words
        index.flatTree.forEach(listId => {
            const listWords = lists[listId].words;
            if (listWords === undefined) {
                return;
            }

            index.words = { ...listWords, ...index.words };
        });

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
        delete state.lists[listId];

        // check if there are any orphaned lists left and remove them as well
        const flatTree = state.index.flatTree;

        // TODO: clean up orphaned words in the `state.index`

        Object.keys(state.lists).forEach(listId => {
            if (flatTree.includes(listId)) {
                return;
            }

            storage.deleteList(listId);
            delete state.lists[listId];
        });

        actions.writeIndex(context);

        // TODO: remove deleted lists from selection
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
    selectList(context: CollectionContext, { listId, append = false, value }: { listId: string; append: boolean; value?: boolean }) {
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

    [Action.setListDisplay](context: CollectionContext, { listId, value }: { listId: string; value: CollectionDisplay }): void {
        const list = state.lists[listId];
        if (list === undefined) {
            return;
        }

        context.commit(Mutation.SET_LIST_DISPLAY, { list, value });

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

    /**
     * `allowDuplicates` will create a new word even if there is already a word with the same text in the index.
     *
     * @param {CollectionContext} context
     * @param {({ listId: string; text: string | string[], allowDuplicates: boolean })} { listId, text, allowDuplicates }
     * @returns {void}
     */
    [Action.addWord](
        context: CollectionContext,
        { listId, text, allowDuplicates = false }: { listId: string; text: string | string[]; allowDuplicates: boolean }
    ): void {
        const list = state.lists[listId];
        if (list === undefined) {
            return;
        }

        const texts = Array.isArray(text) ? text : [text];

        texts.forEach(text => {
            let word;

            if (!context.state.index.hasWord(text)) {
                // check if the world is already in the index and add if it's not there
                word = new CollectionWord({ text });
                context.commit('ADD_WORD_TO_INDEX', { word });
            } else {
                // if the word is in the index, check if `allowDuplicates` is `true`
                word = allowDuplicates ? new CollectionWord({ text }) : context.state.index.getWord(text)!;
            }

            context.commit('ADD_WORD_TO_LIST', { list, wordId: word.id });
        });

        actions.writeIndex(context);
        actions.writeList(context, list.id);
    },

    // TODO: if the defaultListId is invalid, reset the default list to the first list in the tree

    /**
     * Deletes a word from all lists it's in.
     *
     * @param {CollectionContext} context
     * @param {{ wordId: string }} { wordId }
     * @returns {void}
     */
    [Action.deleteWord](context: CollectionContext, { wordId }: { wordId: string }): void {
        const { word, lists } = helpers.findWord(context.state, wordId, true);

        if (!word) {
            return;
        }

        lists!.forEach(list => {
            context.commit(Mutation.SELECT_WORD, { word, value: false });
            context.commit(Mutation.DELETE_WORD, { list, wordId: word.id });

            actions.writeList(context, list.id);
        });

        context.commit(Mutation.DELETE_WORD_FROM_INDEX, { word });

        actions.writeIndex(context);
    },

    // TODO: implement function to

    /**
     * Move a word from one list to the other give a word id and the target list id.
     *
     * @param {CollectionContext} context
     * @param {{ wordId: string; listId: string }} { wordId, listId } id of the word to move and id of the list to move the word to
     * @returns {void}
     */
    [Action.moveWord](context: CollectionContext, { wordId, listId }: { wordId: string; listId: string }): void {
        console.warn('Not available yet');
        return;

        const { word } = helpers._findWord(context, wordId, true);
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
        console.warn('Not available yet');
        return;

        type AggregatedLists = { [name: string]: { list: CollectionList; words: CollectionWord[] } };

        // map selected words to their corresponding lists, so each lists can be processed in turn
        const lists = state.selectedWords.reduce<AggregatedLists>((map, { id }) => {
            const { word, list } = helpers._findWord(context, id);
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
                context.commit(Mutation.DELETE_WORD, { list, wordId: word.id });
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
    setWordText(context: CollectionContext, { wordId, value, searchAll }: { wordId: string; value: string; searchAll?: boolean }): void {
        const { word } = helpers.findWord(context.state, wordId, searchAll);
        if (!word) {
            return;
        }

        context.commit(Mutation.SET_WORD_TEXT, { word, value });
        actions.writeIndex(context);
    },

    setWordFavourite(
        context: CollectionContext,
        { wordId, value, searchAll }: { wordId: string; value: string; searchAll?: boolean }
    ): void {
        const { word } = helpers.findWord(context.state, wordId, searchAll);

        if (!word) {
            return;
        }

        context.commit('SET_WORD_FAVOURITE', { word, value });
        actions.writeIndex(context);
    },

    setWordArchived(
        context: CollectionContext,
        { wordId, value, searchAll }: { wordId: string; value?: boolean; searchAll?: boolean }
    ): void {
        const { word } = helpers.findWord(context.state, wordId, searchAll);

        if (!word) {
            return;
        }

        context.commit(Mutation.SET_WORD_ARCHIVED, { word, value });
        actions.writeIndex(context);
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
        { wordId, append = false, value, searchAll }: { wordId: string; append: boolean; value?: boolean; searchAll?: boolean }
    ): void {
        if (!append) {
            context.commit(Mutation.DESELECT_ALL_WORDS);
        }

        const { word } = helpers.findWord(context.state, wordId, searchAll);

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
    // TODO: this is wrong, an action should not be used like this; move this somewhere else; why?
    // Fuse options: http://fusejs.io
    [Action.performLookup](context: CollectionContext, options?: { value: string }): void {
        const fuseOptions = {
            includeScore: true,
            threshold: 0.3,
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

        const results = state.index.flatTree
            .reduce<LookupResult[]>((resultMap, listId) => {
                const list = state.lists[listId];

                const mappedWords = list.index.map(wordId => context.state.index.words[wordId]);

                const fuse = new Fuse(mappedWords, fuseOptions);
                const items = fuse.search<{ score: number; item: CollectionWord }>(value).map(r => ({ score: r.score, word: r.item }));

                if (items.length === 0) {
                    return resultMap;
                }

                resultMap.push({ list, items });

                return resultMap;
            }, [])
            .sort((a, b) => (a.items.some(item => item.score === 0) ? -1 : 1));

        context.commit(Mutation.SET_LOOKUP_RESULTS, { results });
    }
};

const mutations = {
    // #region EDIT INDEX

    [Mutation.SET_INDEX](state: CollectionState, index: CollectionIndex): void {
        state.index = index;
    },

    [Mutation.SET_LISTS](state: CollectionState, lists: CollectionListMap): void {
        state.lists = lists;
    },

    [Mutation.SET_INDEX_DEFAULT_LIST](state: CollectionState, { list }: { list: CollectionList }): void {
        state.index.defaultListId = list.id;
    },

    [Mutation.SET_INDEX_EXPANDED_TREE](state: CollectionState, { tree, value }: { tree: CollectionTree; value: boolean }): void {
        tree.expanded = value;
    },

    [Mutation.SET_INDEX_TREE](state: CollectionState, { tree }: { tree: CollectionTree }) {
        state.index.tree = tree;
    },

    [Mutation.ADD_LIST](state: CollectionState, { tree, list }: { tree: CollectionTree; list: CollectionList }): void {
        state.addList(tree, list);
    },

    [Mutation.SELECT_LIST](state: CollectionState, { list, value }: { list: CollectionList; value?: boolean }): void {
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

    [Mutation.DESELECT_ALL_LISTS](state: CollectionState): void {
        state.selectedLists.splice(0);
    },

    [Mutation.DELETE_LIST](state: CollectionState, { list, tree }: { list: CollectionList; tree: CollectionTree }): void {
        tree.deleteList(list);
    },

    // #endregion EDIT INDEX

    // #region EDIT LIST

    [Mutation.SET_LIST_NAME](state: CollectionState, { list, value }: { list: CollectionList; value: string }): void {
        list.name = value;
    },

    [Mutation.SET_LIST_DISPLAY](state: CollectionState, { list, value }: { list: CollectionList; value: CollectionDisplay }): void {
        list.display = value;
    },

    [Mutation.SET_LIST_PINNED](state: CollectionState, { list, value }: { list: CollectionList; value: boolean }): void {
        list.pinned = value;
    },

    [Mutation.ADD_WORD_TO_INDEX](state: CollectionState, { word }: { word: CollectionWord }): void {
        state.index.addWord(word);
    },

    [Mutation.ADD_WORD_TO_LIST](state: CollectionState, { list, wordId }: { list: CollectionList; wordId: string }): void {
        list.addWord(wordId);
    },

    [Mutation.DELETE_WORD_FROM_INDEX](state: CollectionState, { word }: { word: CollectionWord }): void {
        state.index.deleteWord(word);
    },

    /**
     * Commits DELETE_WORD mutation.
     *
     * @param {CollectionState} state
     * @param {{ list: CollectionList; word: CollectionWord }} { list, word }
     */
    [Mutation.DELETE_WORD](state: CollectionState, { list, wordId }: { list: CollectionList; wordId: string }): void {
        list.deleteWord(wordId);
    },

    // #endregion

    // #region EDIT WORD

    [Mutation.SET_WORD_TEXT](state: CollectionState, { word, value }: { word: CollectionWord; value: string }): void {
        word.text = value;
    },

    [Mutation.SET_WORD_FAVOURITE](state: CollectionState, { word, value }: { word: CollectionWord; value: boolean }): void {
        word.favourite = value;
    },

    [Mutation.SET_WORD_ARCHIVED](state: CollectionState, { word, value }: { word: CollectionWord; value?: boolean }): void {
        // if no value specified, toggle the state of the archived flag
        if (value === undefined) {
            value = !word.archived;
        }

        word.archived = value;
    },

    [Mutation.SET_WORD_NOTES](state: CollectionState, { word, value }: { word: CollectionWord; value: string }): void {
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
     *
     *
     * @param {CollectionState} state Collection state
     * @param {string} wordId word id
     * @param {boolean} [searchAll=false] if true, search the whole collection; slower; defaults to false
     * @returns {{ word?: CollectionWord; lists?: CollectionList[] }}
     */
    findWord(state: CollectionState, wordId: string, searchAll: boolean = false): { word?: CollectionWord; lists?: CollectionList[] } {
        const listToSearch = searchAll
            ? Object.values(state.lists) // get all the lists
            : state.selectedLists;

        const lists = listToSearch.filter(list => list.index.includes(wordId));

        // the word will be in the found list
        const word = state.index.words[wordId];

        return {
            word,
            lists
        };
    },

    /**
     * Finds and returns a CollectionWord object (given its id) and its parent CollectionList.
     * By default, searches only in the selected lists.
     *
     * @param {CollectionContext} context context to search in
     * @param {string} wordId word id
     * @param {boolean} [searchAll=false] if true, search the whole collection; slower; defaults to false
     * @returns {({ word: CollectionWord?; list?: CollectionList })}
     */
    _findWord(context: CollectionContext, wordId: string, searchAll: boolean = false): { word?: CollectionWord; list?: CollectionList } {
        throw new Error("deprecated, don't use");

        /* const listToSearch = searchAll
            ? Object.values(context.state.lists) // get all the lists
            : context.state.selectedLists;

        const list = listToSearch.find(list => list.words[wordId] !== undefined);

        if (!list) {
            return {};
        }

        // the word will be in the found list
        const word = list.words[wordId];

        return { word, list }; */
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

        // push to the stack item from the top level of the root tree
        stack.push.apply(
            stack,
            root.items.map(item => ({ parent: root, list: item }))
        );

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
