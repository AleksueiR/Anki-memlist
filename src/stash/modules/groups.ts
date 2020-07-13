import { db, Group, GroupDisplayMode } from '@/api/db';
import { reduceArrayToObject, removeFromArrayByValue, wrapInArray, exceptArray } from '@/util';
import Dexie from 'dexie';
import log from 'loglevel';
import { EntrySet, NonJournalStashModule, SelectionMode, Stash, StashModuleState } from '../internal';

export type GroupWordCountSet = Record<number, number>;
export type GroupSet = EntrySet<Group>;

export class GroupsState extends StashModuleState<Group> {
    selectedIds: number[] = [];
    wordCount: GroupWordCountSet = {};
}

export class GroupsModule extends NonJournalStashModule<Group, GroupsState> {
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
        const activeJournal = this.getActiveJournal();

        const groups = await this.table.where({ journalId: activeJournal.id }).toArray();
        const groupSet = reduceArrayToObject(groups);

        this.setAll(groupSet);
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
        const activeJournal = this.getActiveJournal();
        if (!activeJournal) return 0;

        const newGroupId = await db.transaction('rw', this.table, async () => {
            // create a new group entry
            const newGroupId = await this.table.add(new Group(name, activeJournal.id, displayMode));
            const newGroup = await this.table.get(newGroupId);
            if (!newGroup) return log.warn('groups/new: Cannot create a new Group.'), 0;

            // add it to the root group's subGroupIds
            if ((await this.attach(newGroup.id, activeJournal.rootGroupId)) === 0) return 0;

            // add the newly created group to the state and refresh its word count (groups can only be created this way, so it's okay to do it here)
            // otherwise would need to either reload all the journal groups, or have a separate function that can load groups by their ids
            this.addToAll(newGroup);

            return newGroup.id;
        });

        this.refreshWordCounts(newGroupId);

        return newGroupId;
    }

    /**
     *
     *
     * @param {number[]} groupIds
     * @returns {(Promise<void | 0>)}
     * @memberof GroupsModule
     */
    async delete(groupIds: number[]): Promise<void | 0> {
        // TODO: needs more;
        const groups = this.get(this.vetId(groupIds));
        if (groups.length === 0) return;

        await db.transaction('rw', this.table, async () => {
            // remove groupIds from their parent groups
            await Promise.all(groups.map(async ({ id }) => await this.detach(id)));

            // delete from the db
            await db.groups.bulkDelete(groups.map(({ id }) => id));

            // delete from state
            groups.forEach(group => {
                this.removeFromAll(group);
                // TODO: remove deleted groups from the selected group ids list
            });

            this.removeOldWordCounts();
        });

        // Dexie.currentTransaction.abort()
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
     * @returns {(Promise<void | 0>)}
     * @memberof GroupsModule
     */
    async refreshWordCounts(value?: number | number[]): Promise<void | 0> {
        const activeJournal = this.getActiveJournal();
        if (!activeJournal) return 0;

        // filter non-groups if some of the ids are phony
        const groupIds = value ? wrapInArray(this.vetId(value)) : this.getAllIds();

        // get groups from the provided groupIds
        const groups = this.get(groupIds);

        db.transaction('r', db.words, async () => {
            await Promise.all(
                groups.map(async group => {
                    // include `isArchived` condition based on the `displayMode` if it's not set to `all`
                    const isArchivedClause = group.displayMode !== GroupDisplayMode.All ? group.displayMode : void 0;

                    // count the words and dispatch an action to update the state
                    const count = await this.$stash.words.countWordsInAGroup(group.id, isArchivedClause);
                    this.state.wordCount[group.id] = count;
                })
            );
        });

        this.removeOldWordCounts();
    }

    /**
     * Attach a specified groupId to the targetGroupId's subGroupsIds.
     * Return 0 on failure.
     *
     * @protected
     * @param {number} groupId
     * @param {number} targetGroupId
     * @returns {(Promise<void | 0>)}
     * @memberof GroupsModule
     */
    protected async attach(groupId: number, targetGroupId: number): Promise<void | 0> {
        const parentCount = await this.table.where({ subGroupIds: groupId }).count();
        if (parentCount > 0)
            return log.warn(`groups/detach: Group ${groupId} already has a parent. Detach it first.`), 0;

        const targetGroup = this.get(targetGroupId);
        if (!targetGroup) return 0;

        await this.updateStateAndDb(targetGroupId, 'subGroupIds', [...targetGroup.subGroupIds, groupId]);
    }

    /*
     * Detach the specified groupId from it's parent.
     * Return 0 on failure.
     *
     * @protected
     * @param {number} groupId
     * @returns {(Promise<void | 0>)}
     * @memberof GroupsModule
     */
    protected async detach(groupId: number): Promise<void | 0> {
        // get parent group
        const parentGroup = Object.values(this.$stash.groups.all).find(group => group.subGroupIds.includes(groupId));
        if (!parentGroup || !this.isValidId(parentGroup.id))
            return log.warn(`groups/detach: Group #${groupId} has no parent group in the active journal.`), 0;

        // remove groupId from the parent's subgroupIds
        const newParentSubGroupIds = removeFromArrayByValue(parentGroup.subGroupIds, groupId);

        await this.updateStateAndDb(parentGroup.id, 'subGroupIds', newParentSubGroupIds);
    }

    /**
     * Move a groupId from one subgroup to another.
     * Will remove from the current parent group as the same group cannot be in several subgroups.
     *
     * @param {number} groupId Group object to move
     * @param {number} targetGroupId
     * @returns {(Promise<void | 0>)}
     * @memberof GroupsModule
     */
    async move(groupId: number, targetGroupId: number): Promise<void | 0> {
        const activeJournal = this.getActiveJournal();
        if (!activeJournal) return 0;

        if (activeJournal.rootGroupId === groupId) return log.warn(`groups/move: Cannot move the Root Group.`), 0;

        // check that both group and targetGroup exist
        if (!this.isValidId([groupId, targetGroupId])) return 0;

        if (this.get(targetGroupId)?.subGroupIds.includes(groupId))
            return log.info(`groups/move: Group ${groupId} is already a direct subgroup of ${targetGroupId}.`), 0;

        if (groupId === targetGroupId) return log.warn(`groups/move: Cannot move into itself.`), 0;

        // check if targetGroupId is a descendant of the groupId
        if (this.isDescendant(groupId, targetGroupId))
            return log.warn(`groups/move: Cannot move a Group into one of its descendent subgroups.`), 0;

        return db.transaction(
            'rw',
            this.table,
            async (): Promise<void | 0> => {
                if ((await this.detach(groupId)) === 0) return Dexie.currentTransaction.abort(), 0;
                if ((await this.attach(groupId, targetGroupId)) === 0) return 0;
            }
        );
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
     * @param {SelectionMode} [selectionMode=SelectionMode.Replace]
     * @returns {(Promise<void | 0>)}
     * @memberof GroupsModule
     */
    async setSelectedIds(
        groupIds: number | number[],
        selectionMode: SelectionMode = SelectionMode.Replace
    ): Promise<void> {
        // sanitize group ids and remove Root Group id if present
        this.validateId(groupIds);
        const idList = wrapInArray(groupIds);

        let newSelectedGroupIds;

        switch (selectionMode) {
            case SelectionMode.Replace:
                newSelectedGroupIds = idList;
                break;

            case SelectionMode.Add:
                newSelectedGroupIds = [...new Set([...this.state.selectedIds, ...idList])];
                break;

            case SelectionMode.Remove:
                newSelectedGroupIds = this.state.selectedIds.filter(id => !idList.includes(id));
                break;

            default:
                throw new Error(`groups/setSelectedIds: Unknown code ${selectionMode}.`);
        }

        this.state.selectedIds = newSelectedGroupIds;
        await this.refreshWordCounts(this.state.selectedIds);

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
        if ((await this.updateStateAndDb(groupId, 'displayMode', displayMode)) === 0) return 0;
        if ((await this.refreshWordCounts(groupId)) === 0) return 0;
    }

    /**
     * Remove word count of the groups no longer in the journal.
     *
     * @protected
     * @memberof GroupsModule
     */
    protected removeOldWordCounts() {
        const allIds = this.getAllIds();

        Object.keys(this.state.wordCount).forEach(key => {
            if (!allIds.includes(+key)) delete this.state.wordCount[+key];
        });
    }

    /**
     *
     *
     * @param {(number | number[])} ids
     * @param {boolean} [excludeRootGroup=false]
     * @returns {number[]}
     * @memberof GroupsModule
     */
    vetId(ids: number | number[], excludeRootGroup = false): number[] {
        let vettedIds = super.vetId(ids);

        if (excludeRootGroup) {
            const rootGroupId = this.getActiveJournal()?.rootGroupId ?? -1;
            vettedIds = removeFromArrayByValue(vettedIds, rootGroupId);
        }

        return vettedIds;
    }

    /**
     *
     *
     * @param {(number | number[])} value
     * @param {boolean} [excludeRootGroup=false]
     * @returns {boolean}
     * @memberof GroupsModule
     */
    isValidId(value: number | number[], excludeRootGroup = false): boolean {
        const ids = wrapInArray(value);
        return this.vetId(ids, excludeRootGroup).length === ids.length;
    }

    validateId(value: number | number[], allowRootGroup = false): void {
        const ids = [...new Set(wrapInArray(value))];

        const groupIds = allowRootGroup
            ? this.getAllIds()
            : removeFromArrayByValue(this.getAllIds(), this.getActiveJournal()?.rootGroupId);

        const invalidIds = exceptArray(ids, groupIds);

        if (invalidIds.length > 0) throw new Error(`groups/validateId: Group ids ${invalidIds} are invalid.`);
    }
}
