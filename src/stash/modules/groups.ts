import { db, Group, GroupDisplayMode, WordArchived } from '@/api/db';
import { reduceArrayToObject } from '@/util';
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
     *
     * @returns {Promise<void>}
     */
    async fetchJournalGroups(): Promise<void> {
        const activeJournalId = this.$stash.journals.activeId;
        if (!activeJournalId) return; // active journal is not set

        const groups = await this.table.where({ journalId: activeJournalId }).toArray();

        const groupSet = reduceArrayToObject(groups);

        this.setAll(groupSet); // this will replace all the previously fetched groups
        this.refreshWordCounts();
    }

    /**
     * Create a Root Group for the active journal and add it to the state. Return group id.
     *
     * @param {string} [name='Root group']
     * @returns {Promise<number>}
     * @memberof GroupsModule
     */
    async createRootGroup(name: string = 'Root group'): Promise<number> {
        const activeJournal = this.$stash.journals.active;
        if (!activeJournal) throw new Error('groups/createRootGroup: Active journal is not set');

        if (activeJournal.rootGroupId) return activeJournal.rootGroupId; // root group is already set;

        // create a new group and get it from db
        const rootGroupId = await this.table.add(new Group(name, activeJournal.id));
        const rootGroup = await this.getFromDb(rootGroupId);

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
     * @param {number[]} [groupIds]
     * @returns {Promise<void>}
     * @memberof GroupsModule
     */
    protected async refreshWordCounts(groupIds?: number[]): Promise<void> {
        // get groups from the provided groupIds and filter non-groups if some of the ids are phony
        groupIds = groupIds ?? Object.keys(this.all).map(k => +k);
        const groups = await this.table
            .where('id')
            .anyOf(groupIds)
            .toArray();

        await Promise.all(
            groups.map(async group => {
                // include `isArchived` condition based on the `displayMode` if it's not set to `all`
                const isArchivedClause = group.displayMode !== GroupDisplayMode.All ? group.displayMode : void 0;

                // count the words and dispatch an action to update the state
                // TODO: move this function to words module as modules should only touch their own tables
                const count = await this.$stash.words.countWordsInAGroup(group.id, isArchivedClause);
                this.setWordCount(group.id, count);
            })
        );
    }

    /**
     * Set word count for the specified group.
     *
     * @param {number} groupId
     * @param {number} count
     * @memberof GroupsModule
     */
    protected setWordCount(groupId: number, count: number): void {
        this.state.wordCount[groupId] = count;
    }
}
