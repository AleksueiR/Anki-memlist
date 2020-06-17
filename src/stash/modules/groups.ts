import { db, Group, GroupDisplayMode, Journal } from '@/api/db';
import { reduceArrayToObject, removeFromArrayByValue } from '@/util';
import log from 'loglevel';
import { EntrySet, Stash, StashModule, StashModuleState } from '../internal';

export type GroupWordCountSet = Record<number, number>;
export type GroupSet = EntrySet<Group>;

export class GroupsState extends StashModuleState<Group> {
    selectedIds: number[] = [];
    wordCount: GroupWordCountSet = {};
}

export class GroupsModule extends StashModule<Group, GroupsState> {
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
     * Fetches groups belonging to the active journal.
     * Return 0 if active journal is not set.
     *
     * @returns {(Promise<void | 0>)}
     * @memberof GroupsModule
     */
    async fetchJournalGroups(): Promise<void | 0> {
        const activeJournal = this.getActiveJournal();
        if (!activeJournal) return 0;

        const groups = await this.table.where({ journalId: activeJournal.id }).toArray();
        const groupSet = reduceArrayToObject(groups);

        this.setAll(groupSet); // this will replace all the previously fetched groups
        this.refreshWordCounts();
    }

    /**
     * Create a Root Group for the active journal and add it to the state. Return group id.
     * Returns the id of the root group or 0 on failure.
     *
     * @param {string} [name='Root group']
     * @returns {(Promise<number | 0>)}
     * @memberof GroupsModule
     */
    async createRootGroup(name = 'Root group'): Promise<number | 0> {
        const activeJournal = this.getActiveJournal();
        if (!activeJournal) return 0;

        if (activeJournal.rootGroupId) return activeJournal.rootGroupId; // root group is already set;

        // create a new group and get it from db
        const rootGroupId = await this.table.add(new Group(name, activeJournal.id));
        const rootGroup = await this.getFromDb(rootGroupId);
        if (!rootGroup) return 0;

        // add it directly to the state
        this.addToAll(rootGroup);

        // and return its id
        return rootGroupId;
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
     * @protected
     * @param {number[]} [groupIds]
     * @returns {(Promise<void | 0>)}
     * @memberof GroupsModule
     */
    protected async refreshWordCounts(groupIds?: number[]): Promise<number | 0> {
        const activeJournal = this.getActiveJournal();
        if (!activeJournal) return 0;

        // get groups from the provided groupIds and filter non-groups if some of the ids are phony
        const groups = this.get(this.vetIds(groupIds));

        return await Promise.all(
            groups.map(async group => {
                // include `isArchived` condition based on the `displayMode` if it's not set to `all`
                const isArchivedClause = group.displayMode !== GroupDisplayMode.All ? group.displayMode : void 0;

                // count the words and dispatch an action to update the state
                const count = await this.$stash.words.countWordsInAGroup(group.id, isArchivedClause);
                this.state.wordCount[group.id] = count;
            })
        ).then(() => groups.length);
    }

    /**
     * Attach a specified groupId to the targetGroupId's subGroupsIds.
     * Return 0 on failure.
     *
     * @param {number} groupId
     * @param {number} targetGroupId
     * @returns {(Promise<void | 0>)}
     * @memberof GroupsModule
     */
    async attach(groupId: number, targetGroupId: number): Promise<void | 0> {
        // check that both group and targetGroup exist
        if (!this.isValid([groupId, targetGroupId])) return 0;

        const targetGroup = this.get(targetGroupId);
        if (!targetGroup) return 0;

        await this.updateStateAndDb(targetGroupId, 'subGroupIds', [...targetGroup.subGroupIds, groupId]);
    }

    /**
     * Detach the specified groupId from it's parent.
     * Return 0 on failure.
     *
     * @param {*} content
     * @param {*} groupId
     * @returns {Promise<void>}
     */
    async detach(groupId: number): Promise<void | 0> {
        if (!this.isValid(groupId)) return 0;

        // get parent group
        const parentGroup = Object.values(this.$stash.groups.all).find(group => group.subGroupIds.includes(groupId));
        if (!parentGroup || !this.isValid(parentGroup.id))
            return log.warn(`groups/detach: Group #${groupId} has no parent group in the active journal.`), 0;

        // remove groupId from the parent's subgroupIds
        const newParentSubGroupIds = removeFromArrayByValue(parentGroup.subGroupIds, groupId);

        await this.updateStateAndDb(parentGroup.id, 'subGroupIds', newParentSubGroupIds);
    }

    /**
     * Return an active journal or undefined if the active journal is not set.
     *
     * @protected
     * @returns {(Journal | undefined)}
     * @memberof GroupsModule
     */
    protected getActiveJournal(): Journal | undefined {
        const activeJournal = this.$stash.journals.active;
        if (!activeJournal) return log.warn('groups: Active journal is not set'), undefined;

        return activeJournal;
    }

    /**
     * Check if the supplied group id is valid and belongs to the active journal.
     *
     * @param {number} id
     * @returns {boolean}
     * @memberof GroupsModule
     */
    isValid(id: number): boolean;
    isValid(ids: number[]): boolean;
    isValid(value: number | number[]): boolean {
        if (Array.isArray(value)) {
            return value.every(id => this.isValid(id));
        }

        const activeJournal = this.getActiveJournal();
        if (!activeJournal) return false;

        const group = this.get(value);
        if (!group) return false;

        if (group.journalId !== activeJournal.id) {
            log.warn(`groups/isValid: Group ${value} doesn't belong to Journal ${activeJournal.id}.`);
            return false;
        }

        return true;
    }
}
