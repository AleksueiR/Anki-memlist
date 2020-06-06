import { RootState } from '@/store/state';
import { reduceArrayToObject, removeFromArrayByValue } from '@/util';
import { Module } from 'vuex';
import { make, Payload } from 'vuex-pathify';
import db, { Group, GroupDisplayMode, Journal } from './../journals/db';

export type GroupSet = { [name: number]: Group };
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
    /**
     * Returns a list of selected groups based on the list of selected group ids.
     *
     * @param {*} state
     * @returns {Group[]}
     */
    selected(state): Group[] {
        return state.selectedIds.map(id => state.all[id]);
    }
};

groups.actions = {
    /**
     * Fetches groups belonging to the active journal.
     *
     * @returns {Promise<void>}
     */
    async fetchJournalGroups(): Promise<void> {
        const groups = await db.groups.where({ journalId: this.get<number>('journals/activeId')! }).toArray();

        const groupSet = reduceArrayToObject(groups);

        this.set('groups/all', groupSet);
        this.set('groups/refreshWordCounts!');
    },

    /**
     * Count words in the provided groups using the group's `GroupDisplayMode`. If not words provided, count words in all the groups.
     * Call this:
     * - on the initial load and when a word is added, deleted, moved, or archived;
     * - when the display mode of a group changes;
     * - when a new list added.
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
                    group.displayMode !== GroupDisplayMode.all
                        ? { isArchived: group.displayMode === GroupDisplayMode.active }
                        : {};

                // count the words and dispatch an action to update the state
                await db.words
                    .where({ memberGroupIds: group.id, ...isArchivedClause })
                    .count()
                    .then(count => this.set(`groups/wordCount@${group.id}`, count));
            })
        ).then(() => void 0);
    },

    /**
     * Create a new `Group` in the root group and return its id when finished.
     *
     * @param {*} { state }
     * @returns {Promise<number>}
     */
    async new({ state }): Promise<number> {
        const newGroup = await db.transaction('rw', db.groups, db.journals, async () => {
            const { rootGroupId, id: activeJournalId } = this.get<Journal>('journals/active')!;

            // create a new group entry
            const newGroupId = await db.groups.put(new Group('New Group', activeJournalId));

            // add it to the root group's subGroupIds
            const rootGroupSubGroupIds = (await db.groups.get(rootGroupId))!.subGroupIds;
            await this.set(`groups/all@${rootGroupId}.subGroupIds`, [...rootGroupSubGroupIds, newGroupId]);

            // and return the newly created group
            return (await db.groups.get(newGroupId))!;
        });

        // add the newly created group to the state and refresh its word count (groups can only be created this way, so it's okay to do it here)
        // otherwise would need to either reload all the journal groups, or have a separate function that can load groups by their ids
        this.set('groups/all', { ...state.all, ...{ [newGroup.id]: newGroup } });
        this.set('groups/refreshWordCounts!', [newGroup.id]);

        return newGroup.id;
    },

    /**
     * Move a `Group` from one subgroup to another.
     * Will remove from the current parent group as the same group cannot be in several subgroups.
     *
     * @param {*} { state }
     * @param {{ groupId: number; targetGroupId: number }} { groupId, targetGroupId } move `groupId` to `targetGroupId` subGroups
     * @returns {Promise<void>}
     */
    async move({ state }, { groupId, targetGroupId }: { groupId: number; targetGroupId: number }): Promise<void> {
        return db.transaction('rw', db.groups, async () => {
            // find the parent group and remove `groupId` from its subgroups
            const parentGroup = (await db.groups.where({ subGroupIds: groupId }).first())!;
            const newParentSubGroupIds = removeFromArrayByValue([...parentGroup.subGroupIds], groupId);

            // dispatch an action to update the parent group state;
            await this.set(`groups/all@${parentGroup.id}.subGroupIds`, newParentSubGroupIds);

            // get the target group and add `groupId` to its subgroups
            const targetGroup = (await db.groups.where({ subGroupIds: targetGroupId }).first())!;
            await this.set(`groups/all@${targetGroupId}.subGroupsIds`, [...targetGroup.subGroupIds, groupId]);
        });
    },

    /**
     * Sets the selected group ids and dispatches the `fetchGroupWords` action.
     *
     * @param {*} { state }
     * @param {number[]} groupIds
     * @returns {Promise<void>}
     */
    async setSelectedIds({ state }, groupIds: number[]): Promise<void> {
        // TODO: check if group belong to this journal
        // TODO: check if the group can be selected, as in if it's in the visible tree (do we assume if it belongs to journal, it's visible as we shouldn't have hidden groups)
        this.set('groups/selectedIds!', groupIds);

        // TODO: clear existing lookup
        // when selected groups change, refresh the list of words
        await this.set('words/fetchGroupWords!');
    },

    /**
     * This is a "catch-all" action to intersect sub-properties writes to `state.all` by pathify and keep the db in sync.
     *
     * @param {*} { state }
     * @param {*} payload
     * @returns {Promise<void>}
     */
    async setAll({ state }, payload): Promise<void> {
        // if not a Payload, call the default pathify mutation
        if (!(payload instanceof Payload)) {
            this.set('groups/all!', payload);
            return;
        }

        // update the state using the payload function as expected and pass it to the default pathify mutation
        this.set('groups/all!', payload.update(state.all));

        const [id, field, ...rest] = payload.path.split('.');

        // this check might not be needed if all call are proper
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
