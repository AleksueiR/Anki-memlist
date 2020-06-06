import { handleActionPayload } from '@/store/common';
import { RootState } from '@/store/state';
import { Module } from 'vuex';
import { make } from 'vuex-pathify';
import db, { Journal } from './db';

export type JournalSet = { [name: number]: Journal };

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
    /**
     * Return an active `Journal` based on the active journal id.
     *
     * @param {*} state
     * @returns {Journal}
     */
    active(state): Journal {
        return state.all[state.activeId];
    }
};

journals.actions = {
    async fetch(): Promise<void> {
        const journals = await db.journals.toArray();

        const journalSet = journals.reduce<JournalSet>((map, journal) => ((map[journal.id] = journal), map), {});
        const journal = journals[0];

        this.set('journals/all', journalSet);
        this.set('journals/activeId', journal.id); // loading the first journal by default for now

        await this.set('groups/fetchJournalGroups!'); // fetch groups for the active journal

        if (~journal.defaultGroupId) {
            this.set('groups/selectedIds', journal.defaultGroupId);
        }
    },

    async setAll({ state }, payload): Promise<void> {
        await handleActionPayload(this, db.journals, state.all, 'journals/all!', payload);
    }
};

journals.mutations = { ...make.mutations(state) };

export { journals };
