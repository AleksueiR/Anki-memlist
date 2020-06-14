import { db, Group, Journal } from '@/api/db';
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

    /**
     * Fetches groups belonging to the active journal.
     *
     * @returns {Promise<void>}
     */
    async fetchJournalGroups(): Promise<void> {
        const activeJournalId = this.$stash.journals.activeId;
        if (!activeJournalId) return; // active journal is not set

        const groups = await db.groups.where({ journalId: activeJournalId }).toArray();

        const groupSet = reduceArrayToObject(groups);

        // this.set('groups/all', groupSet); // this will replace all the previously fetched groups
        // this.set('groups/refreshWordCounts!');
    }
}
