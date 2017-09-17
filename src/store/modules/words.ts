import storage from '../../api/storage';
import * as types from '../mutation-types';

import { WordInterface } from '../../types';

import Vuex from 'vuex';

// initial state
const state = {
    all: []
};

// getters
const getters = {
    allWords: (state: any):WordInterface[] => state!.all
};

// actions
const actions = {
    async getAllWords({ commit }: { commit: Vuex.Commit }) {
        commit(types.RECEIVE_WORDS, { words: await storage.getWords() });
    }
};

// mutations
const mutations = {
    [types.RECEIVE_WORDS](state: any, { words }: { words: WordInterface[] }) {
        state.all = words;
    }/*,

    [types.ADD_TO_CART](state, { id }) {
        state.all.find(p => p.id === id).inventory--
    }*/
}

export default {
    state,
    getters,
    actions,
    mutations
};