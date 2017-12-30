import { ActionContext, Store } from 'vuex';
import { getStoreAccessors } from 'vuex-typescript';

import gists from './../../../api/gists';

import { Word, WordsState } from './words-state';
import { State as RootState } from './../../state';

import { storage, gistIdKey, gistFileNameKey } from './../../../settings';

const gistId: string = storage.get(gistIdKey) as string;
const gistFileName = storage.get(gistFileNameKey) as string;

type WordsContext = ActionContext<WordsState, RootState>;

const state: WordsState = {
    selectedItem: null,
    items: []
};

// getters
// retuns Word collection from the WordsState store
const getters = {
    items: (state: WordsState): Word[] => state.items,
    selectedIted: (state: WordsState): Word | null => state.selectedItem
};

// actions
const actions = {
    async fetchWords(context: WordsContext): Promise<void> {
        console.log('fetchwords');

        cKeepWords(context, {
            items: (await gists.get<WordsState>(gistId, gistFileName)).items
        });
    },

    async syncWords(context: WordsContext): Promise<void> {
        return await gists.post<WordsState>(state, gistId, gistFileName);
    }
};

// mutations
const mutations = {
    selectWord(state: WordsState, item: Word) {
        state.selectedItem = item;
    },

    // stores Word collection in the WordsState store
    keepWords(state: WordsState, { items }: { items: Word[] }) {
        state.items = items.map(item => new Word(item));
    },

    addWord(state: WordsState, word: Word) {
        state.items.push(word);
    },

    removeWord(state: WordsState, word: Word) {
        const index: number = state.items.findIndex((w: Word) => w === word);

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

const { commit, read, dispatch } = getStoreAccessors<WordsState, RootState>(
    'words'
);

// getter
export const rItems = read(getters.items);
export const rSelectedItem = read(getters.selectedIted);

// action
export const dFetchWods = dispatch(actions.fetchWords);
export const dSyncWords = dispatch(actions.syncWords);

//mutations
export const cSelectWord = commit(mutations.selectWord);
/* export */ const cKeepWords = commit(mutations.keepWords);
export const cAddWord = commit(mutations.addWord);
export const cRemoveWord = commit(mutations.removeWord);
