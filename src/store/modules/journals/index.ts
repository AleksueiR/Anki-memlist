import { Module } from 'vuex';
import { make } from 'vuex-pathify';

import to from 'await-to-js';

import { RootState } from '@/store/state';

import db, { IJournal } from './db';

export type JournalSet = { [name: number]: IJournal };

export class JournalsState {
    all: JournalSet = {};
    activeId: number | -1 = -1;
}

const state = new JournalsState();

const journals: Module<JournalsState, RootState> = {
    namespaced: true,
    state,
    getters: {},
    actions: {},
    mutations: {}
};

journals.getters = {
    active(state): IJournal {
        return state.all[state.activeId];
    }
};

journals.actions = {
    async fetch(): Promise<void> {
        const journals = await db.journals.toArray();

        const journalSet = journals.reduce<JournalSet>((map, journal) => ((map[journal.id!] = journal), map), {});
        const journal = journals[0];

        this.set('journals/all', journalSet);
        this.set('journals/activeId', journal.id!); // loading the first journal by default for now

        await this.set('groups/fetchJournalGroup!', journal.id!); // fetch groups from this journal

        if (~journal.defaultGroupId) {
            this.set('groups/selectedIds', journal.defaultGroupId);
        }
    }
};

journals.mutations = { ...make.mutations(state) };

export { journals };
