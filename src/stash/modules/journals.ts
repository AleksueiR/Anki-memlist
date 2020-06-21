import { db, Group, Journal } from '@/api/db';
import { reduceArrayToObject } from '@/util';
import log from 'loglevel';
import { EntrySet, Stash, StashModule, StashModuleState } from '../internal';

export type JournalSet = EntrySet<Journal>;

export class JournalsState extends StashModuleState<Journal> {
    activeId: number | null = null;
}

export class JournalsModule extends StashModule<Journal, JournalsState> {
    constructor(stash: Stash) {
        super(stash, db.journals, JournalsState);
    }

    get activeId(): number | null {
        return this.state.activeId;
    }

    get active(): Journal | null {
        return this.all[this.activeId ?? -1] || null;
    }

    /**
     * Fetch journals from the db and load the active one.
     *
     * @returns {Promise<void>}
     */
    async fetch(): Promise<void> {
        const journals = await this.table.toArray();

        const journalSet = reduceArrayToObject(journals);

        // TODO: pick a journal to load somehow (a setting/option/user?)

        const journal = journals[0];

        this.setAll(journalSet);
        await this.setActiveId(journal.id); // loading the first journal by default for now
    }

    /**
     * Create a new Journal with the name provided, and add it to the state and db.
     * Returns the id of the new journal or 0 on failure.
     *
     * @param {string} [name='Default Journal']
     * @returns {(Promise<number | 0>)}
     * @memberof JournalsModule
     */
    async new(name = 'Default Journal'): Promise<number | 0> {
        // create and get a new journal
        const newJournalId = await this.table.add(new Journal(name));
        const newJournal = await this.getFromDb(newJournalId);
        if (!newJournal) return log.warn('journals/new: Cannot create a new journal.'), 0;

        // create a Root Group directly from here as it's done only during the initial set up and cannot be changed later
        const rootGroupId = await db.groups.add(new Group('Root group', newJournal.id));
        const rootGroup = await db.groups.get(rootGroupId);
        if (!rootGroup) return log.warn('journals/new: Cannot create a Root Group.'), 0;

        // add the newly created journal directly to the state
        // since it's a new journal and it's already in DB and it's not active yet this will not trigger any further fetching from the db
        this.addToAll(newJournal);

        // set rootGroupId of the active Journal;
        // rootGroupId cannot be changed after a journal is created
        await this.updateStateAndDb(newJournal.id, 'rootGroupId', rootGroupId);
        await this.setActiveId(newJournal.id);

        return newJournal.id;
    }

    async setActiveId(value: number | null = null): Promise<void> {
        this.state.activeId = value;

        // TODO: moar

        await this.$stash.groups.fetchJournalGroups();
    }

    /**
     * Set name of the specified Journal.
     * Returns 0 if the operation doesn't succeed.
     *
     * @param {number} journalId
     * @param {string} name
     * @returns {(Promise<void | 0>)}
     * @memberof JournalsModule
     */
    async setName(journalId: number, name: string): Promise<void | 0> {
        return this.updateStateAndDb(journalId, 'name', name);
    }

    /**
     * Set the defaultGroupId of the active Journal.
     * Returns 0 if the operation doesn't succeed.
     *
     * @param {(number | null)} defaultGroupId
     * @returns {(Promise<void | 0>)}
     * @memberof JournalsModule
     */
    async setDefaultGroupId(defaultGroupId: number | null): Promise<void | 0> {
        if (!this.activeId) return log.warn('journals/setRootGroupId: Active journal is not set.'), 0;
        if (defaultGroupId && !this.$stash.groups.isValid(defaultGroupId)) return 0;

        return this.updateStateAndDb(this.activeId, 'defaultGroupId', defaultGroupId);
    }
}
