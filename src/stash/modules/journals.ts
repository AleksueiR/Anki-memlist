import { db, Group, Journal } from '@/api/db';
import { reduceArrayToObject } from '@/util';
import { $updateGenericStateAndDb, SpecificUpdater, StashModule } from '../common';

export type JournalSet = Record<number, Journal>;

export class JournalsState {
    all: JournalSet = {};
    activeId: number | null = null;
}

export class JournalsModule extends StashModule {
    protected $state: JournalsState = new JournalsState();

    get all(): JournalSet {
        return this.$state.all;
    }

    get activeId(): number | null {
        return this.$state.activeId;
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
        const journals = await db.journals.toArray();

        const journalSet = reduceArrayToObject(journals);

        // TODO: pick a journal to load somehow (a setting/option/user?)
        const journal = journals[0];

        this.setAll(journalSet);
        this.setActiveId(journal.id); // loading the first journal by default for now
    }

    protected async getFromDb(journalId: number): Promise<Journal> {
        const journal = await db.journals.get(journalId);
        if (!journal) throw new Error('journals/getFromDb: Cannot load a Journal record.');

        return journal;
    }

    /**
     * Create a new Journal and add it to the db.
     *
     * @param {*} { state }
     * @returns {Promise<number>}
     */
    async new(name = 'Default Journal'): Promise<number> {
        // create and get a new journal
        const newJournalId = await db.journals.add(new Journal(name));
        const journal = await this.getFromDb(newJournalId);

        // add the newly created journal directly to the state
        // since it's a new journal and it's already in DB and it's not active yet this will not trigger any further fetching from the db
        this.setAll({ ...this.$state.all, ...{ [journal.id]: journal } });

        // create a root group for this new journal, set its `journalId` and journal's `rootGroupId`
        const rootGroupId = await db.groups.add(new Group('Root group', journal.id));
        await this.updateStateAndDb(journal.id, 'rootGroupId', rootGroupId);

        return newJournalId;
    }

    protected setAll(value: JournalSet): void {
        this.$state.all = value;
    }

    setActiveId(value: number | null): void {
        this.$state.activeId = value;
    }

    setName(journalId: number, name: string): void {
        this.$state.all[journalId].name = name;

        this.updateStateAndDb(journalId, 'name', name);
    }

    setRootGroupId(journalId: number, rootGroupId: number | null): void {
        this.updateStateAndDb(journalId, 'rootGroupId', rootGroupId);
    }

    setDefaultGroupId(journalId: number, defaultGroupId: number | null): void {
        this.updateStateAndDb(journalId, 'defaultGroupId', defaultGroupId);
    }

    reset(): void {
        Object.assign(this.$state, new JournalsState());
    }

    protected updateStateAndDb: SpecificUpdater<Journal> = async (...args): Promise<void> => {
        $updateGenericStateAndDb(this.$state.all, db.journals, ...args);
    };
}
