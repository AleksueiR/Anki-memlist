import { Module } from 'vuex';
import { make } from 'vuex-pathify';

import to from 'await-to-js';

import { RootState } from '@/store/state';

import db, { IWord, IGroup, reduceArrayToObject } from './../journals/db';

export type WordSet = { [name: number]: IWord };
export type WordGroupCollection = { group: IGroup; words: IWord[] }[];

export class WordsState {
    all: WordSet = {};
    selectedIds: number[] = [];
}

const state = new WordsState();

const words: Module<WordsState, RootState> = {
    namespaced: true,
    state,
    getters: {},
    actions: {},
    mutations: {}
};

words.getters = {
    pooled(state): WordGroupCollection {
        // return state.selectedIds.map(id => state.all[id]);
        return [];
    }
};

words.actions = {
    async fetchGroupWords(context, selectedGroupIds: number[]): Promise<void> {
        const words = await db.words
            .where('memberGroupIds')
            .anyOf(selectedGroupIds)
            .toArray();

        const wordSet = reduceArrayToObject(words);

        this.set('words/all', wordSet);
    },

    async fetchLookupWords(context): Promise<void> {
        // TODO:
    }
};

words.mutations = { ...make.mutations(state) };

export { words };
