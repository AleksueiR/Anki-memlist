import { handleActionPayload } from '@/store/common';
import { RootState } from '@/store/state';
import { reduceArrayToObject, removeFromArrayByValue } from '@/util';
import { Module } from 'vuex';
import { make } from 'vuex-pathify';
import { db, Group, GroupDisplayMode, Journal } from '@/api/db';

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
    // async fetchJournalGroups(): Promise<void> {
    //     const activeJournalId = this.get<number>('journals/activeId');
    //     const groups = await db.groups.where({ journalId: activeJournalId }).toArray();

    //     const groupSet = reduceArrayToObject(groups);

    //     this.set('groups/all', groupSet); // this will replace all the previously fetched groups
    //     this.set('groups/refreshWordCounts!');
    // },

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
    // async refreshWordCounts({ state }, groupIds?: number[]): Promise<void> {
    //     // TODO: check with DB if groupIds exist?
    //     // get groups from the provided groupIds and filter non-groups if some of the ids are phony
    //     const groups = groupIds ? groupIds.map(id => state.all[id]).filter(a => a) : Object.values(state.all);

    //     await Promise.all(
    //         groups.map(async group => {
    //             // include `isArchived` condition based on the `displayMode` if it's not set to `all`
    //             const isArchivedClause =
    //                 group.displayMode !== GroupDisplayMode.all
    //                     ? { isArchived: group.displayMode === GroupDisplayMode.archived }
    //                     : {};

    //             // count the words and dispatch an action to update the state
    //             await db.words
    //                 .where({ memberGroupIds: group.id, ...isArchivedClause })
    //                 .count()
    //                 .then(count => this.set(`groups/wordCount@${group.id}`, count)); // call mutation
    //         })
    //     );
    // },

    /**
     * Create a new `Group` in the root group and return its id when finished.
     *
     * @param {*} { state }
     * @returns {Promise<number>}
     */
    async new({ state }): Promise<number> {
        // get active journal
        const activeJournal = this.get<Journal | undefined>('journals/active');
        if (!activeJournal) throw new Error('groups/new: Cannot create new Group. Active Journal is not set.');

        const newGroup = await db.transaction('rw', db.journals, db.groups, async () => {
            // create a new group entry
            const newGroupId = await db.groups.put(new Group('New Group', activeJournal.id));
            const newGroup = await db.groups.get(newGroupId);
            if (!newGroup) throw new Error('groups/new: Cannot create and load a Group record.');

            // add it to the root group's subGroupIds
            await this.set('groups/attach!', { groupId: newGroup.id, targetGroupId: activeJournal.rootGroupId });

            // and return the newly created group
            return newGroup;
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
     * @param {*} context
     * @param {{ groupId: number; targetGroupId: number }} { groupId, targetGroupId }
     * @returns {Promise<void>}
     */
    async move(context, { groupId, targetGroupId }: { groupId: number; targetGroupId: number }): Promise<void> {
        await db.transaction('rw', db.groups, async () => {
            await this.set('groups/detach!', groupId);
            await this.set('groups/attach!', { groupId, targetGroupId });
        });
    },

    async delete({ state }, groupIds: number[]): Promise<void> {
        groupIds = groupIds.filter(groupId => state.all[groupId]);
        if (groupIds.length === 0) return; // if groupId is invalid, do nothing

        await db.transaction('rw', db.groups, db.words, async () => {
            await this.set('words/???', groupIds);

            // remove groupIds from their parent groups
            await Promise.all(groupIds.map(async groupId => await this.set('groups/detach!', groupId)));

            // delete from the db
            await db.groups.bulkDelete(groupIds);
        });

        this.set('groups/delete!', groupIds);
    },

    // /**
    //  * Attaches a specified groupId to the targetGroupId's subGroupsIds.
    //  *
    //  * @param {*} context
    //  * @param {{ groupId: number; targetGroupId: number }} { groupId, targetGroupId }
    //  * @returns {Promise<void>}
    //  */
    // async attach(context, { groupId, targetGroupId }: { groupId: number; targetGroupId: number }): Promise<void> {
    //     const journalId = this.get<number>('journals/activeId');

    //     const group = await db.groups.where({ id: groupId, journalId }).first();
    //     if (!group) throw new Error(`groups/attach: Group #${groupId} doesn't exist in active journal.`);

    //     // get the target group and add `groupId` to its subgroups
    //     const targetGroup = await db.groups.where({ id: targetGroupId, journalId }).first();
    //     if (!targetGroup)
    //         throw new Error(`groups/attach: Target group #${targetGroupId} doesn't exist in active journal.`);

    //     await this.set(`groups/all@${targetGroupId}.subGroupIds`, [...targetGroup.subGroupIds, groupId]);
    // },

    // /**
    //  * Detaches the specified groupId from it's parent.
    //  *
    //  * @param {*} content
    //  * @param {*} groupId
    //  * @returns {Promise<void>}
    //  */
    // async detach(content, groupId): Promise<void> {
    //     const journalId = this.get<number>('journals/activeId');

    //     const group = await db.groups.where({ id: groupId, journalId }).first();
    //     if (!group) throw new Error(`groups/attach: Group #${groupId} doesn't exist in active journal.`);

    //     // get parent group
    //     const parentGroup = await db.groups.where({ subGroupIds: groupId, journalId }).first();
    //     if (!parentGroup) throw new Error(`groups/detach: Group #${groupId} has no parent group in active journal.`);

    //     // remove groupId from the parent's subgroupIds
    //     const newParentSubGroupIds = removeFromArrayByValue(parentGroup.subGroupIds, groupId);

    //     // dispatch an action to update the parent group state;
    //     await this.set(`groups/all@${parentGroup.id}.subGroupIds`, newParentSubGroupIds);
    // },

    // delete
    // call words delete function with a list of words to remove from this groupId
    // words function should process them in batch and only trigger the refresh afterwards
    // after resolving, groups function deletes this group and removes it from its parent

    /**
     * Sets the selected group ids and dispatches the `fetchGroupWords` action.
     *
     * @param {*} context
     * @param {number[]} groupIds
     * @returns {Promise<void>}
     */
    async setSelectedIds({ state }, groupIds: number[]): Promise<void> {
        // TODO: check if group belong to this journal
        // TODO: check if the group can be selected, as in if it's in the visible tree (do we assume if it belongs to journal, it's visible as we shouldn't have hidden groups)
        // if (groupIds.some(groupId => !state.all[groupId]))

        // TODO: append or not?
        // also decide if fetching words in batches makes sense or re-fetch all every time

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
        const result = await handleActionPayload(this, db.groups, state.all, 'groups/all!', payload);

        if (!result) {
            return;
        }

        // dispatch any related actions `after` the db has been updated
        switch (result.field) {
            case 'displayMode':
                await this.set('groups/refreshWordCounts!', [result.id]);
                break;
        }
    }
};

groups.mutations = {
    ...make.mutations(state),

    /**
     * Reset the state to its defaults.
     *
     * @param {*} state
     */
    reset(state): void {
        Object.assign(state, new GroupsState());
    },

    delete(state, groupIds: number[]) {
        groupIds.forEach(groupId => {
            delete state.all[groupId];
            delete state.wordCount[groupId];
        });
    }
};

export { groups };
