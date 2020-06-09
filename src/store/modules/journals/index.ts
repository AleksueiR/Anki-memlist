import { handleActionPayload } from '@/store/common';
import { RootState } from '@/store/state';
import { Module } from 'vuex';
import { make } from 'vuex-pathify';
import db, { Journal, Group } from './db';
import { reduceArrayToObject } from '@/util';

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
    active(state): Journal | undefined {
        return state.all[state.activeId];
    }
};

journals.actions = {
    /**
     * Fetch journals from the db and load the active one.
     *
     * @returns {Promise<void>}
     */
    async fetch(): Promise<void> {
        const journals = await db.journals.toArray();

        const journalSet = reduceArrayToObject(journals);

        // TODO: pick a journal to load somehow (a setting/option/user?)
        const journal = journals[0];

        this.set('journals/all', journalSet);
        this.set('journals/activeId', journal.id); // loading the first journal by default for now
    },

    /**
     * Create a new Journal and add it to the db.
     *
     * @param {*} { state }
     * @returns {Promise<void>}
     */
    async new({ state }): Promise<void> {
        // create and get a new journal
        const journalId = await db.journals.add(new Journal('Default Journal'));

        const journal = await db.journals.get(journalId);
        if (!journal) throw new Error('DB issue: Cannot create and load a new Journal record.');

        // create a root group for this new journal, set its `journalId` and journal's `rootGroupId`
        const rootGroupId = await db.groups.add(new Group('Root group', journal.id));
        await db.journals.update(journal.id, { rootGroupId: rootGroupId });

        // add the newly created journal directly to the state
        // since it's a new journal and it's already in DB and it's not active yet this will not trigger any further fetching from the db
        this.set('journals/all', { ...state.all, ...{ [journal.id]: journal } });
    },

    /**
     * Delete a specified journal with all its groups and words.
     *
     * @param {*} { state }
     * @param {number} journalId
     * @returns {Promise<void>}
     */
    async delete({ state }, journalId: number): Promise<void> {
        // if the journalId doesn't exist, do nothing
        if (!state.all[journalId]) {
            return;
        }

        // if the active journal is being deleted, deselect it first
        if (state.activeId === journalId) {
            await this.set('journals/activeId', -1);
        }

        // delete all words and groups belonging to this journal; delete the journal
        await db.transaction('rw', db.journals, db.groups, db.words, async () => {
            await db.words.where({ journalId }).delete();
            await db.groups.where({ journalId }).delete();
            await db.journals.delete(journalId);
        });

        // delete journal from the state
        delete state.all[journalId];
    },

    /**
     * Set a specified journalId as active and load its groups and words.
     * Passing -1 as the id will deactivate the currently active journal.
     *
     * @param {*} { state }
     * @param {(number | -1)} journalId
     * @returns {Promise<void>}
     */
    async setActiveId({ state }, journalId: number | -1): Promise<void> {
        if (journalId === state.activeId) return; // do nothing if trying the journal is already active

        // ensure journalId exists or use -1
        journalId = state.all[journalId] ? journalId : -1;

        this.set('journals/activeId!', journalId); // call `activeId` mutation directly

        // if the journalId ends up as -1, reset groups and words states and stop
        if (!~journalId) {
            this.set('words/reset');
            this.set('groups/reset');
            return;
        }

        await this.set('groups/fetchJournalGroups!'); // fetch groups for the new active journal

        // set the default group if specified
        const journal = state.all[journalId];
        if (~journal.defaultGroupId) {
            this.set('groups/selectedIds', journal.defaultGroupId);
        }
    },

    /**
     * This is a "catch-all" action to intersect sub-properties writes to `state.all` by pathify and keep the db in sync.
     *
     * @param {*} { state }
     * @param {*} payload
     * @returns {Promise<void>}
     */
    async setAll({ state }, payload): Promise<void> {
        const result = await handleActionPayload(this, db.journals, state.all, 'journals/all!', payload);
        if (!result) return;

        // dispatch any related actions `after` the db has been updated
        switch (result.field) {
            case 'blah':
                break;
        }
    }
};

journals.mutations = { ...make.mutations(state) };

export { journals };
