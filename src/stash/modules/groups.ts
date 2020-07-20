import { db, Group, GroupDisplayMode, getGroupWordIds } from '@/api/db';
import {
    areArraysEqual,
    reduceArrayToObject,
    removeFromArrayByValue,
    updateArrayWithValues,
    UpdateMode,
    wrapInArray
} from '@/util';
import Dexie from 'dexie';
import { CommonStashModule, Stash, StashModuleState } from '../internal';

export type GroupWordCountEntry = {
    [GroupDisplayMode.All]: number;
    [GroupDisplayMode.Active]: number;
    [GroupDisplayMode.Archived]: number;
};

export type GroupWordCountSet = Record<number, GroupWordCountEntry>;

export class GroupsState extends StashModuleState<Group> {
    selectedIds: number[] = [];
    wordCount: GroupWordCountSet = {};
}

export class GroupsModule extends CommonStashModule<Group, GroupsState> {
    constructor(stash: Stash) {
        super(stash, db.groups, GroupsState);
    }

    get selectedIds(): number[] {
        return this.state.selectedIds;
    }

    get wordCount(): GroupWordCountSet {
        return this.state.wordCount;
    }

    /**
     * Fetch groups belonging to the active journal.
     * Return 0 if active journal is not set.
     *
     * @returns {(Promise<void>)}
     * @memberof GroupsModule
     */
    async fetchJournalGroups(): Promise<void> {
        this.reset();

        if (!this.activeJournal) throw new Error('groups/fetchJournalGroups: Active journal is not set.');

        const groups = await this.table.where({ journalId: this.activeJournal.id }).toArray();
        this.state.all = reduceArrayToObject(groups);

        this.refreshWordCounts();
    }

    /**
     * Create a new `Group` in the root group and return its id when finished.
     * Return the id of the new group
     *
     * @param {string} [name='New Group']
     * @param {GroupDisplayMode} [displayMode=GroupDisplayMode.All]
     * @returns {(Promise<number>)}
     * @memberof GroupsModule
     */
    async new(name = 'New Group', displayMode: GroupDisplayMode = GroupDisplayMode.All): Promise<number> {
        const newGroupId = await db.transaction('rw', this.table, async () => {
            if (!this.activeJournal) throw new Error('groups/new: Active journal is not set.');

            // create a new group entry
            const newGroupId = await this.table.put(new Group(name, this.activeJournal.id, displayMode));
            const newGroup = await this.table.get(newGroupId);
            if (!newGroup) {
                Dexie.currentTransaction.abort();
                throw new Error('groups/new: Cannot create a new Group.');
            }

            // add the newly created group to the state and refresh its word count (groups can only be created this way, so it's okay to do it here)
            // otherwise would need to either reload all the journal groups, or have a separate function that can load groups by their ids
            // NOTE: if the `attach` fails, it will leave state with an non-existing group added to it
            this.add(newGroup);

            // add it to the root group's subGroupIds
            await this.attach(newGroup.id, this.activeJournal.rootGroupId);

            return newGroup.id;
        });

        this.refreshWordCounts(newGroupId);

        return newGroupId;
    }

    /**
     * Delete specified groups and words belonging to these groups.
     *
     * @param {(number | number[])} groupIds
     * @param {boolean} [deleteLinkedWords=false] if true, also deletes any linked words that exist in other groups
     * @returns {Promise<void>}
     * @memberof GroupsModule
     */
    async delete(groupIds: number | number[], deleteLinkedWords = false): Promise<void> {
        const groupIdList = wrapInArray(groupIds);
        groupIdList.forEach(groupId => {
            if (!this.isValid(groupId))
                throw new Error(`groups/delete: Group #${groupId} is not valid in active journal`);
        });

        await db.transaction('rw', this.table, db.words, db.wordsInGroups, async () => {
            await Promise.all(
                groupIdList.map(async groupId => {
                    // remove groupIds from their parent groups
                    await this.detach(groupId);

                    // get word ids for this group
                    const wordIds = await getGroupWordIds(groupId);

                    // if `deleteLinkedWords` is false, delete words only from this group
                    await (deleteLinkedWords
                        ? this.$stash.words.delete(wordIds, true)
                        : this.$stash.words.delete(wordIds, groupId));

                    // delete sub groups and their words in turn
                    await this.delete(this.get(groupId)?.subGroupIds || [], deleteLinkedWords);
                })
            );

            // delete groups from the db
            await db.groups.bulkDelete(groupIdList);
        });

        // adjust selected ids
        await this.setSelectedIds(groupIdList, UpdateMode.Remove);
        // remove them from state
        groupIdList.forEach(groupId => this.remove(groupId));
        this.removeOldWordCounts();
    }

    /**
     * Count words in the provided groups using the group's `GroupDisplayMode`. If not words provided, count words in all the groups.
     * Call this:
     * - on the initial load and when a word is added, deleted, moved, or archived;
     * - when the display mode of a group changes;
     * - when a new list added.
     *
     * Return 0 if the active journal is not set or the number of groups counts updated (if no groups have been updated, also return 0).
     *
     * @param {(number | number[])} [value]
     * @returns {(Promise<void>)}
     * @memberof GroupsModule
     */
    async refreshWordCounts(value?: number | number[]): Promise<void> {
        // get all ids if none were supplied
        const groupIds = wrapInArray(value || this.state.allIds);

        await Promise.all(
            groupIds.map(async groupId => {
                // check if the group value is valid in this journal only for supplied ids
                // there is no sense in refreshing word count for groups that are not loaded
                if (value && !this.isValid(groupId))
                    throw new Error(`groups/refreshWordCounts: Group #${groupId} is not valid in active journal`);

                const wordIds = await getGroupWordIds(groupId);

                const allWordCount = wordIds.length;
                const activeWordCount = await db.words
                    .where('id')
                    .anyOf(wordIds)
                    .filter(word => word.isArchived === GroupDisplayMode.Active)
                    .count();

                this.state.wordCount[groupId] = {
                    [GroupDisplayMode.All]: allWordCount,
                    [GroupDisplayMode.Active]: activeWordCount,
                    [GroupDisplayMode.Archived]: allWordCount - activeWordCount
                };
            })
        );

        this.removeOldWordCounts();
    }

    /**
     * Attach a specified groupId to the targetGroupId's subGroupsIds.
     *
     * @protected
     * @param {number} groupId
     * @param {number} targetGroupId
     * @returns {Promise<void>}
     * @memberof GroupsModule
     */
    protected async attach(groupId: number, targetGroupId: number): Promise<void> {
        if (!this.isValid(groupId) || !this.isValid(targetGroupId))
            throw new Error(`groups/attach: Group #${groupId} is not valid in active journal.`);

        if (groupId === this.activeJournal?.rootGroupId) throw new Error(`groups/attach: Cannot attach Root Group.`);

        const parentCount = await this.table.where({ subGroupIds: groupId }).count();
        if (parentCount > 0) throw new Error(`groups/attach: Group #${groupId} already has a parent. Detach it first.`);

        const targetGroup = this.get(targetGroupId);
        if (!targetGroup) throw new Error(`groups/attach: Group #${targetGroupId} does not exist`);

        await this.updateStateAndDb(targetGroupId, 'subGroupIds', [...targetGroup.subGroupIds, groupId]);
    }

    /*
     * Detach the specified groupId from it's parent.
     *
     * @protected
     * @param {number} groupId
     * @returns {(Promise<void>)}
     * @memberof GroupsModule
     */
    protected async detach(groupId: number): Promise<void> {
        if (!this.isValid(groupId)) throw new Error(`groups/detach: Group #${groupId} is not valid in active journal.`);

        // get parent group
        const parentGroup = await this.table.where({ subGroupIds: groupId }).first();
        if (!parentGroup) return; // already detached

        // remove groupId from the parent's subgroupIds
        const newParentSubGroupIds = removeFromArrayByValue(parentGroup.subGroupIds, groupId);

        await this.updateStateAndDb(parentGroup.id, 'subGroupIds', newParentSubGroupIds);
    }

    /**
     * Move a groupId from one subgroup to another.
     * Will remove from the current parent group as the same group cannot be in several subgroups.
     *
     * @param {number} groupId
     * @param {number} targetGroupId
     * @returns {Promise<void>}
     * @memberof GroupsModule
     */
    async move(groupId: number, targetGroupId: number): Promise<void> {
        // `groupId` is already a direct subgroup of `targetGroupId`
        if (this.get(targetGroupId)?.subGroupIds.includes(groupId)) return;

        if (groupId === targetGroupId) throw new Error(`groups/move: Cannot move Group #${groupId} into itself.`);

        // check if targetGroupId is a descendant of the groupId
        if (this.isDescendant(groupId, targetGroupId))
            throw new Error(`groups/move: Group #${targetGroupId} is a descendant of #${groupId}`);

        return db.transaction('rw', this.table, async () => {
            await this.detach(groupId);
            await this.attach(groupId, targetGroupId);
        });
    }

    /**
     * Checks if the provided subGroupId is a descendent subgroup of the parentGroupId.
     *
     * @protected
     * @param {number} groupAId
     * @param {number} groupBId
     * @returns {boolean}
     * @memberof GroupsModule
     */
    protected isDescendant(groupAId: number, groupBId: number): boolean {
        const parentGroup = this.get(groupAId);
        if (!parentGroup) return false;

        if (parentGroup.subGroupIds.includes(groupBId)) return true;

        return parentGroup.subGroupIds.map(subGroupId => this.isDescendant(subGroupId, groupBId)).some(value => value);
    }

    /**
     * Set provided group ids as selected.
     * Selection mode lets you add to, remove from, or replace the existing selection list.
     *
     * @param {(number | number[])} groupIds
     * @param {*} [updateMode=UpdateMode.Replace]
     * @returns {Promise<void>}
     * @memberof GroupsModule
     */
    async setSelectedIds(value: number | number[], updateMode = UpdateMode.Replace): Promise<void> {
        if (!this.activeJournal) throw new Error('groups/setSelectedIds: Active journal is not set.');

        const groupIds = wrapInArray(value);

        // check if group ids are present in the state
        if (groupIds.some(groupId => !this.isValid(groupId)))
            throw new Error(`groups/setSelectedIds: Group #${value} is not valid.`);

        // check that the Root group is not being selected
        if (groupIds.includes(this.activeJournal.rootGroupId))
            throw new Error(`groups/setSelectedIds: Root Group cannot be selected.`);

        const newSelectedGroupIds = updateArrayWithValues(this.selectedIds, wrapInArray(groupIds), updateMode);
        if (areArraysEqual(this.state.selectedIds, newSelectedGroupIds)) return;

        this.state.selectedIds = newSelectedGroupIds;
        this.refreshWordCounts(this.state.selectedIds);

        // load words from the selected groups
        await this.$stash.words.fetchGroupWords();
    }

    /**
     * Set name of the specified group.
     *
     * @param {number} groupId
     * @param {string} name
     * @returns {(Promise<void | 0>)}
     * @memberof GroupsModule
     */
    async setName(groupId: number, name: string): Promise<void | 0> {
        throw Error('Implement me!');
        // return this.updateStateAndDb(groupId, 'name', name);
    }

    /**
     * Set the display mode of a given group.
     *
     * @param {number} groupId
     * @param {GroupDisplayMode} displayMode
     * @returns {(Promise<void | 0>)}
     * @memberof GroupsModule
     */
    async setDisplayMode(groupId: number, displayMode: GroupDisplayMode): Promise<void | 0> {
        throw Error('Implement me!');
        /* if ((await this.updateStateAndDb(groupId, 'displayMode', displayMode)) === 0) return 0;
        if ((await this.refreshWordCounts(groupId)) === 0) return 0; */
    }

    /**
     * Remove word count of the groups no longer in the journal.
     *
     * @protected
     * @memberof GroupsModule
     */
    protected removeOldWordCounts() {
        const allIds = this.state.allIds;

        Object.keys(this.state.wordCount).forEach(key => {
            if (!allIds.includes(+key)) delete this.state.wordCount[+key];
        });
    }
}
