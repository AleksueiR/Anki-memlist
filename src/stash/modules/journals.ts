import { Journal, db } from '@/api/db';
import { StashModule } from './../internal';
import { reduceArrayToObject } from '@/util';

export type JournalSet = { [name: number]: Journal };

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

        console.log('accessing stash', this.$stash);
    }

    reset(): void {
        Object.assign(this.$state, new JournalsState());
    }

    setName(id: number, name: string): void {
        this.$state.all[id].name = name;
    }

    setAll(value: JournalSet): void {
        this.$state.all = value;
    }

    setActiveId(value: number | null): void {
        this.$state.activeId = value;
    }
}
