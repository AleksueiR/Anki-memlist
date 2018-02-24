import { ActionContext, Store } from 'vuex';

import storage from './../../../api/storage';
import {
    CollectionState,
    CollectionIndex,
    CollectionList,
    CollectionTree,
    CollectionWord
} from './collection-state';
import { State as RootState } from './../../state';
import { isArray } from 'util';

type CollectionContext = ActionContext<CollectionState, RootState>;

const state: CollectionState = new CollectionState();

// getters
const getters = {
    getPooledWords(state: CollectionState): CollectionWord[] {
        if (state.selectedLists.length === 0) {
            return [];
        }

        console.log('update tppool', state.selectedLists[0]);

        const pooledWords = (<CollectionWord[]>[]).concat(
            ...state.selectedLists.map(list =>
                list.index.map(wordId => list.words.get(wordId)!)
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

// actions
const actions = {
    feck(context: CollectionContext) {
        // context.state.halp = !context.state.halp;
        context.commit('FECK', !context.state.halp.feck);
    },

    // #region EDIT INDEX

    async fetchIndex(context: CollectionContext): Promise<void> {
        let index: CollectionIndex = state.index;
        let lists: Map<string, CollectionList> = state.lists;

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

        const defaultList = state.lists.get(state.index.defaultListId);
        if (defaultList === undefined) {
            return;
        }

        context.commit('SELECT_LIST', defaultList);
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
            const list = state.lists.get(lId);
            if (list === undefined) {
                return;
            }

            storage.saveList(list as CollectionList);
        }
    },

    setIndexTree(
        context: CollectionContext,
        options: { tree: CollectionTree }
    ): void {
        const { tree } = options;

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
            context.commit('SET_DEFAULT_LIST', list);
        }

        actions.writeList(context, list.id);
        actions.writeIndex(context);
    },

    removeList(context: CollectionContext, listId: string): void {
        // find its tree parent
        // context.commit('REMOVE_LIST_FROM_TREE', { tree: state.index.tree, list });
    },

    setDefaultList(context: CollectionContext, listId: string): void {
        const list = state.lists.get(listId);
        if (list === undefined) {
            return;
        }

        context.commit('SET_DEFAULT_LIST', list);
    },

    /**
     * Add the specified list to the `selectedLists` array
     *
     * @param {CollectionContext} context
     * @param {{ listId: string; annex: boolean }} options
     * @returns
     */
    selectList(
        context: CollectionContext,
        options: { listId: string; annex: boolean }
    ) {
        const { listId, annex = false } = options;

        if (!annex) {
            context.commit('DESELECT_ALL_LISTS');
        }

        const list = state.lists.get(listId);
        if (list === undefined) {
            return;
        }

        context.commit('SELECT_LIST', list);
    },

    /**
     * Removes the specified list from the `selectedLists` array.
     *
     * @param {CollectionContext} context
     * @param {{ listId: string }} { listId }
     * @returns {void}
     */
    deselectList(
        context: CollectionContext,
        { listId }: { listId: string }
    ): void {
        const list = state.lists.get(listId);
        if (list === undefined) {
            return;
        }

        context.commit('DESELECT_LIST', list);
    },

    deselectAllLists(context: CollectionContext): void {
        context.commit('DESELECT_ALL_LISTS');
    },

    // #endregion EDIT INDEX

    // #region EDIT LIST

    setListName(
        context: CollectionContext,
        { listId, name }: { listId: string; name: string }
    ): void {
        const list = state.lists.get(listId);
        if (list === undefined) {
            return;
        }

        context.commit('SET_LIST_NAME', { list, name });

        actions.writeList(context, list.id);
    },

    addWord(
        context: CollectionContext,
        { listId, word }: { listId: string; word: CollectionWord }
    ): void {
        const list = state.lists.get(listId);
        if (list === undefined) {
            return;
        }

        context.commit('ADD_WORD', { list, word });

        actions.writeList(context, list.id);
    },

    removeWord(context: CollectionContext, options: { wordId: string }): void {
        const list = Array.from(state.lists.values()).find(list =>
            list.words.has(options.wordId)
        );
        if (!list) {
            return;
        }

        const word = list.words.get(options.wordId);

        if (!word) {
            return;
        }

        context.commit('REMOVE_WORD', { list, word });
        context.commit('DESELECT_WORD', word);
        actions.writeList(context, list.id);
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
        { wordId, value }: { wordId: string; value: string }
    ): void {
        const word: CollectionWord = context.getters.getPooledWords.find(
            (word: CollectionWord) => word.id === wordId
        );

        if (word === undefined) {
            return;
        }

        context.commit('SET_WORD_TEXT', { word, value });
    },

    setWordFavourite(
        context: CollectionContext,
        { wordId, value }: { wordId: string; value: boolean }
    ): void {
        const word: CollectionWord | null = helpers.getWordFromPooled(
            context,
            wordId
        );

        if (!word) {
            return;
        }

        context.commit('SET_WORD_FAVOURITE', { word, value });
    },

    setWordFavourite_(
        context: CollectionContext,
        { word, value }: { word: CollectionWord; value: boolean }
    ): void {
        word.favourite = value;
    },

    selectWord(
        context: CollectionContext,
        options: { wordId: string; annex: boolean }
    ): void {
        const { wordId, annex = false } = options;

        if (!annex) {
            context.commit('DESELECT_ALL_WORDS');
        }

        const word: CollectionWord = context.getters.getPooledWords.find(
            (word: CollectionWord) => word.id === wordId
        );

        //const word = state.lists.get(listId);
        if (word === undefined) {
            return;
        }

        context.commit('SELECT_WORD', word);
    },

    deselectWord(
        context: CollectionContext,
        options: { wordId: string }
    ): void {
        const { wordId } = options;

        // find a list with the provided wordId
        const list = Array.from(state.lists.values()).find(list =>
            list.words.has(wordId)
        );
        if (list === undefined) {
            return;
        }

        // get the word from the list
        const word: CollectionWord | undefined = list.words.get(wordId);

        if (word === undefined) {
            return;
        }

        context.commit('DESELECT_WORD', word);
    },

    deselectAllWords(context: CollectionContext): void {
        context.commit('DESELECT_ALL_Words');
    }

    // #endregion
};

// mutations
const mutations = {
    FECK(state: CollectionState, value: boolean): void {
        state.halp.feck = value;
    },

    // #region EDIT INDEX

    SET_INDEX(state: CollectionState, index: CollectionIndex): void {
        state.index = index;
    },

    SET_LISTS(
        state: CollectionState,
        lists: Map<string, CollectionList>
    ): void {
        state.lists = lists;
    },

    SET_DEFAULT_LIST(state: CollectionState, list: CollectionList): void {
        state.index.defaultListId = list.id;
    },

    SET_INDEX_TREE(state: CollectionState, options: { tree: CollectionTree }) {
        state.index.tree = options.tree;
    },

    ADD_LIST(
        state: CollectionState,
        { tree, list }: { tree: CollectionTree; list: CollectionList }
    ): void {
        state.addList(tree, list);
    },

    SELECT_LIST(state: CollectionState, list: CollectionList): void {
        // do not select the same list twice
        const index = state.selectedLists.findIndex(
            selectedList => selectedList.id === list.id
        );
        if (index !== -1) {
            return;
        }

        state.selectedLists.push(list);
    },

    DESELECT_LIST(state: CollectionState, list: CollectionList): void {
        const index = state.selectedLists.findIndex(
            selectedList => selectedList.id === list.id
        );

        if (index === -1) {
            return;
        }

        state.selectedLists.splice(index, 1);
    },

    DESELECT_ALL_LISTS(state: CollectionState): void {
        state.selectedLists.splice(0);
    },

    // #endregion EDIT INDEX

    // #region EDIT LIST

    SET_LIST_NAME(
        state: CollectionState,
        { list, name }: { list: CollectionList; name: string }
    ): void {
        list.name = name;
    },

    ADD_WORD(
        state: CollectionState,
        { list, word }: { list: CollectionList; word: CollectionWord }
    ): void {
        list.addWord(word);
    },

    REMOVE_WORD(
        state: CollectionState,
        { list, word }: { list: CollectionList; word: CollectionWord }
    ): void {
        list.removeWord(word);
    },

    // #endregion

    // #region EDIT WORD

    SET_WORD_TEXT(
        state: CollectionState,
        { word, value }: { word: CollectionWord; value: string }
    ): void {
        word.text = value;
    },

    SET_WORD_FAVOURITE(
        state: CollectionState,
        { word, value }: { word: CollectionWord; value: boolean }
    ): void {
        word.favourite = value;
    },

    SET_WORD_ARCHIVED(
        state: CollectionState,
        { word, value }: { word: CollectionWord; value: boolean }
    ): void {
        word.archived = value;
    },

    SET_WORD_NOTES(
        state: CollectionState,
        { word, value }: { word: CollectionWord; value: string }
    ): void {
        word.notes = value;
    },

    SELECT_WORD(state: CollectionState, word: CollectionWord): void {
        // do not select the same list twice
        const index = state.selectedWords.findIndex(
            selectedWord => selectedWord.id === word.id
        );
        if (index !== -1) {
            return;
        }

        state.selectedWords.push(word);
    },

    DESELECT_WORD(state: CollectionState, word: CollectionWord): void {
        const index = state.selectedWords.findIndex(
            selectedWord => selectedWord.id === word.id
        );

        if (index === -1) {
            return;
        }

        state.selectedWords.splice(index, 1);
    },

    DESELECT_ALL_WORDS(state: CollectionState): void {
        state.selectedWords.splice(0);
    }

    // #endregion
};

const helpers = {
    getWordFromPooled(
        context: CollectionContext,
        wordId: string
    ): CollectionWord | null {
        const word: CollectionWord = context.getters.getPooledWords.find(
            (word: CollectionWord) => word.id === wordId
        );

        if (word === undefined) {
            return null;
        }

        return word;
    }
};

export const collection = {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};

/**
 * A helper function to get a CollectionList by its ide from the lists array.
 * TODO: use a dictionary for fast lookup as specified here: https://forum.vuejs.org/t/error-form-binding-with-vuex-do-not-mutate-vuex-store-state-outside-mutation-handlers/11941/8
 *
 * @param {string} listId
 * @returns {(CollectionList | null)}
 */
/* function state.lists.get(listId: string): CollectionList | null {
    return state.lists.find(l => l.id === listId) || null;
} */
