import { ActionContext, Store } from 'vuex';
import { getStoreAccessors } from 'vuex-typescript';

import jsonbin from './../../../api/jsonbin';

import { Word, WordsState } from './wordsState';
import { State as RootState } from './../../state';

type WordsContext = ActionContext<WordsState, RootState>;

const state: WordsState = { items: [] };

// getters
const getters = {
    items: (state: WordsState): Word[] => state.items
};

// actions
const actions = {
    async fetchWords(context: WordsContext): Promise<void> {
        cKeepWords(context, { items: (await jsonbin.get<WordsState>()).items })
    },

    async syncWords(context: WordsContext): Promise<void> {
        return await jsonbin.post<WordsState>(state);
    }
};

// mutations
const mutations = {
    keepWords(state: WordsState, { items }: { items: Word[] }) {
        state.items = items;
    },

    addWord(state: WordsState, word: Word) {
        state.items.push(word);
    }

    /*[types.RECEIVE_WORDS](state: WordsState, { items }: { items: Word[] }) {
        state.items = items;
    }*//*,

    [types.ADD_TO_CART](state, { id }) {
        state.all.find(p => p.id === id).inventory--
    }*/
}

export const words = {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};

const { commit, read, dispatch } = getStoreAccessors<WordsState, RootState>('words');

// getter
export const rItems = read(getters.items);

// action
export const dFetchWods = dispatch(actions.fetchWords);
export const dSyncWords = dispatch(actions.syncWords);

//mutations
/* export */ const cKeepWords = commit(mutations.keepWords);
export const cAddWord = commit(mutations.addWord);