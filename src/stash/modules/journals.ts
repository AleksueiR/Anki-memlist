import { db, Journal } from '@/api/db';
import { reduceArrayToObject } from '@/util';
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
        console.log('rere');

        const journals = await this.table.toArray();

        const journalSet = reduceArrayToObject(journals);

        // TODO: pick a journal to load somehow (a setting/option/user?)
        const journal = journals[0];

        this.setAll(journalSet);
        this.setActiveId(journal.id); // loading the first journal by default for now
    }

    /**
     * Create a new Journal with the name provided, and add it to the state and db.
     *
     * @param {string} [name='Default Journal']
     * @returns {Promise<number>}
     * @memberof JournalsModule
     */
    async new(name = 'Default Journal'): Promise<number> {
        // create and get a new journal
        const newJournalId = await db.journals.add(new Journal(name));
        const newJournal = await this.getFromDb(newJournalId);

        // add the newly created journal directly to the state
        // since it's a new journal and it's already in DB and it's not active yet this will not trigger any further fetching from the db
        this.addToAll(newJournal);

        this.setActiveId(newJournal.id);

        // create a root group for this new journal, set its `journalId` and journal's `rootGroupId`
        const rootGroupId = await this.$stash.groups.createRootGroup();
        await this.updateStateAndDb(newJournal.id, 'rootGroupId', rootGroupId);

        return newJournalId;
    }

    setActiveId(value: number | null): void {
        this.state.activeId = value;

        // TODO: moar
    }

    /**
     * Set name of the specified Journal.
     *
     * @param {number} journalId
     * @param {string} name
     * @memberof JournalsModule
     */
    setName(journalId: number, name: string): void {
        this.all[journalId].name = name;

        this.updateStateAndDb(journalId, 'name', name);
    }

    /**
     * Set rootGroupId of the specified Journal
     *
     * @param {number} journalId
     * @param {(number | null)} rootGroupId
     * @memberof JournalsModule
     */
    setRootGroupId(journalId: number, rootGroupId: number | null): void {
        this.updateStateAndDb(journalId, 'rootGroupId', rootGroupId);
    }

    setDefaultGroupId(journalId: number, defaultGroupId: number | null): void {
        this.updateStateAndDb(journalId, 'defaultGroupId', defaultGroupId);
    }
}
