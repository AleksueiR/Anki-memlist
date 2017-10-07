import { ActionContext, Store } from 'vuex';
import { getStoreAccessors } from 'vuex-typescript';

import jsonbin from './../../../api/jsonbin';
import gists from './../../../api/gists';

import { Word, WordsState } from './words-state';
import { State as RootState } from './../../state';

type WordsContext = ActionContext<WordsState, RootState>;

const state: WordsState = {
    items: []
};

// getters
const getters = {
    items: (state: WordsState): Word[] => state.items
};

// actions
const actions = {
    async fetchWords(context: WordsContext): Promise<void> {
        cKeepWords(context, { items: (await gists.get<WordsState>()).items })
    },

    async syncWords(context: WordsContext): Promise<void> {
        return await gists.post<WordsState>(state);
    }
};

// mutations
const mutations = {
    keepWords(state: WordsState, { items }: { items: Word[] }) {
        state.items = items.map(item => new Word(item));
    },

    addWord(state: WordsState, word: Word) {
        state.items.push(word);
    },

    removeWord(state: WordsState, word: Word) {
        const index: number = state.items.findIndex((w: Word) => w === word );

        if (index !== -1) {
            state.items.splice(index, 1);
        }
    }
};

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
export const cRemoveWord = commit(mutations.removeWord);