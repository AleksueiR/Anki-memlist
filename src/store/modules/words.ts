import storage from '../../api/storage';
import * as types from '../mutation-types';

import { Word } from '../../types';

import Vuex from 'vuex';

// initial state
class WordsState {
    constructor(public items: Word[] = []) {}
}

const state: WordsState = new WordsState();

// getters
const getters = {
    items: (state: WordsState):Word[] => state.items
};

// actions
const actions = {
    async getAllWords({ commit }: { commit: Vuex.Commit }) {
        commit(types.RECEIVE_WORDS, { words: await storage.getWords() });
    }
};

// mutations
const mutations = {
    [types.RECEIVE_WORDS](state: any, { words }: { words: Word[] }) {
        state.all = words;
    }/*,

    [types.ADD_TO_CART](state, { id }) {
        state.all.find(p => p.id === id).inventory--
    }*/
}

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};

export { WordsState };