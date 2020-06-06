import { RootState } from '@/store/state';
import { reduceArrayToObject } from '@/util';
import { Module } from 'vuex';
import { make } from 'vuex-pathify';
import db, { Group, Word } from './../journals/db';

export type WordSet = { [name: number]: Word };
export type WordGroupCollection = { group: Group; words: Word[] }[];

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
    /**
     * Fetches words belonging to the currently active groups.
     *
     * @returns {Promise<void>}
     */
    async fetchGroupWords(): Promise<void> {
        const words = await db.words
            .where('memberGroupIds')
            .anyOf(this.get<number[]>('groups/selectedIds')!)
            .toArray();

        const wordSet = reduceArrayToObject(words);

        this.set('words/all', wordSet);

        // TODO: check if the currently selected words need to be deselected
    },

    async fetchLookupWords(context): Promise<void> {
        // TODO:
    }
};

words.mutations = { ...make.mutations(state) };

export { words };
