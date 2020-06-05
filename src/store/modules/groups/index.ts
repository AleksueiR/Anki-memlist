import { Module } from 'vuex';
import { Payload, make } from 'vuex-pathify';

import to from 'await-to-js';

import { RootState } from '@/store/state';

import db, { IGroup, reduceArrayToObject, GroupDisplayMode } from './../journals/db';

import { CollectionDisplay } from './../collection';

export type GroupSet = { [name: number]: IGroup };
export type GroupWordCountSet = { [name: number]: number };

export class GroupsState {
    all: GroupSet = {};
    selectedIds: number[] = [];

    /**
     * Represents
     *
     * @type {GroupWordCountSet}
     * @memberof GroupsState
     */
    wordCount: GroupWordCountSet = {};
}

const state = new GroupsState();

const groups: Module<GroupsState, RootState> = {
    namespaced: true,
    state,
    getters: {},
    actions: {},
    mutations: {}
};

groups.getters = {
    selected(state): IGroup[] {
        return state.selectedIds.map(id => state.all[id]);
    },

    wordCount: state => (groupId: number, mode: CollectionDisplay) => {
        const wordCount = db.words.where({ memberGroupIds: groupId }).count();
    }
};

groups.actions = {
    async fetchJournalGroup({ state }, journalId: number): Promise<void> {
        const groups = await db.groups.where({ journalId: journalId }).toArray();

        const groupSet = reduceArrayToObject(groups);

        this.set('groups/all', groupSet);
        this.set('groups/refreshWordCounts!');
    },

    /**
     * Count words in the provided groups using the group's `GroupDisplayMode`. If not words provided, count words in all the groups.
     * - call this on the initial load and when a word is added, deleted, moved, or archived;
     * - call this when the display mode of a group changes.
     *
     * @param {*} { state }
     * @param {number[]} [groupIds]
     * @returns {Promise<void>}
     */
    async refreshWordCounts({ state }, groupIds?: number[]): Promise<void> {
        const groups = groupIds ? groupIds.map(id => state.all[id]) : Object.values(state.all);

        return Promise.all(
            groups.map(async group => {
                // include `isArchived` condition based on the `displayMode` if it's not set to `all`
                const isArchivedClause =
                    group.displayMode !== GroupDisplayMode.all ? { isArchived: group.displayMode === GroupDisplayMode.active } : {};

                await db.words
                    .where({
                        memberGroupIds: group.id,
                        ...isArchivedClause
                    })
                    .count()
                    .then(count => this.set(`groups/wordCount@${group.id}`, count));
            })
        ).then(() => void 0);
    },

    async setSelectedIds(context, groupIds: number[]): Promise<void> {
        // TODO: check if group belong to this journal
        this.set('groups/selectedIds!', groupIds);

        // TODO: clear existing lookup
        await this.set('words/fetchGroupWords!', groupIds);
    },

    /**
     *
     *
     * @param {*} context
     * @param {*} payload
     * @returns {Promise<void>}
     */
    async setAll(context, payload): Promise<void> {
        // if not a Payload, call the default pathify mutation
        if (!(payload instanceof Payload)) {
            this.set('groups/all!', payload);
            return;
        }

        // update the state using the payload function as expected and pass it to the default pathify mutation
        this.set('groups/all!', payload.update(state.all));

        const [id, field, ...rest] = payload.path.split('.');

        if (rest.length > 0) {
            console.warn('Attempting to change a deep property');

            return;
        }

        // update the corresponding db objects
        await db.groups.update(+id, { [field]: payload.value });

        // dispatch any related actions `after` the db has been updated
        switch (field) {
            case 'displayMode':
                this.set('groups/refreshWordCounts!', [+id]);
                break;
        }
    }
};

groups.mutations = {
    ...make.mutations(state)
};

export { groups };
