import { RootState } from '@/store/state';
import { Module } from 'vuex';
import { make, Payload } from 'vuex-pathify';
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

    async setAll(context, payload): Promise<void> {
        // if not a Payload, call the default pathify mutation
        if (!(payload instanceof Payload)) {
            this.set('journals/all!', payload);
            return;
        }

        // update the state using the payload function as expected and pass it to the default pathify mutation
        this.set('journals/all!', payload.update(state.all));

        const [id, field, ...rest] = payload.path.split('.');

        // this check might not be needed if all call are proper
        if (rest.length > 0) {
            console.warn('Attempting to change a deep property');
            return;
        }

        // update the corresponding db objects
        await db.journals.update(+id, { [field]: payload.value });

        // dispatch any related actions `after` the db has been updated
        switch (field) {
            case 'displayMode':
                this.set('groups/refreshWordCounts!', [+id]);
                break;
        }
    }
};

journals.mutations = { ...make.mutations(state) };

export { journals };
