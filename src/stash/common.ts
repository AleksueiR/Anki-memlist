import { DBCommonEntry, DBEntry, isValidDBCommonEntry, Journal } from '@/api/db';
import { wrapInArray } from '@/util';
import { Table } from 'dexie';
import log from 'loglevel';
import { Stash } from './internal';

export type SpecificUpdater<K> = <T extends keyof Omit<K, 'id'>, S extends K[T]>(
    id: number,
    key: T,
    value: S
) => Promise<void | 0>;

export type EntrySet<K> = Record<number, K>;

/**
 * Represents a state object of the stash module.
 *
 * @export
 * @class StashModuleState
 * @template K entry class
 */
export class StashModuleState<K> {
    all: EntrySet<K> = {};

    get allIds(): number[] {
        return Object.keys(this.all).map(k => +k);
    }
}

/**
 * A state constructor to create an empty state.
 *
 * @export
 * @interface IStashModuleStateClass
 * @template K
 * @template T
 */
export interface StashModuleStateClass<K, T extends StashModuleState<K>> {
    new (): T;
}

/**
 * A stash module class providing some default functions.
 *
 * @export
 * @class StashModule
 * @template K entry class
 * @template T state class
 */
export class StashModule<K extends DBEntry, T extends StashModuleState<K>> {
    protected readonly $stash: Stash;

    protected readonly table: Table<K, number>;
    protected readonly state: T;

    private readonly StateClass: StashModuleStateClass<K, T>;

    constructor(stash: Stash, table: Table, StateClass: StashModuleStateClass<K, T>) {
        const map = { $stash: stash, table, StateClass };

        // mark $stash as not enumerable so Vue doesn't make it reactive
        Object.entries(map).forEach(([key, value]) =>
            Object.defineProperty(this, key, {
                value,
                enumerable: false,
                writable: false
            })
        );

        this.state = new StateClass();
    }

    /**
     * Return the full entry set.
     *
     * @readonly
     * @type {EntrySet<K>}
     * @memberof StashModule
     */
    get all(): EntrySet<K> {
        return this.state.all;
    }

    protected existInState(id: number): boolean {
        return this.state.all[id] !== undefined;
    }

    protected addToState(value: K): void {
        if (this.all[value.id]) throw new Error(`${this.moduleName}/add: Entry ${value.id} already exists.`);

        this.state.all[value.id] = value;
    }

    protected putInState(value: K): void {
        this.state.all[value.id] = value;
    }

    protected deleteFromState(value: K | number): void {
        delete this.all[typeof value === 'number' ? value : value.id];
    }

    /**
     * Get an Entry (or a list of Entries) with the id specified from the state.
     *
     * @param {number} id
     * @returns {(K | undefined)}
     * @memberof StashModule
     */
    get(id: number): K | undefined {
        return this.state.all[id];
    }

    /**
     * Get an Entry with the id specified directly from the db.
     * Throws an error if the id is not valid.
     *
     * @protected
     * @param {number} id
     * @returns {Promise<K>}
     * @memberof StashModule
     */
    protected async getFromDb(id: number): Promise<K | undefined> {
        return this.table.get(id);
    }

    /**
     * Check if the supplied id is valid in the State.
     *
     * @param {number} id
     * @returns {boolean}
     * @memberof StashModule
     */
    isValid(id: number): boolean {
        return this.state.all[id] !== undefined;
    }

    /**
     * Check if the supplied entry id is valid in the State
     *
     * @param {number} id
     * @returns {Promise<boolean>}
     * @memberof StashModule
     */
    async isValidInDb(id: number): Promise<boolean> {
        return (await this.table.where({ id }).count()) === 1;
    }

    /**
     * Update a specified record in the entry set and update the corresponding record in the db.
     * Returns the number of entries updated (1 or 0);
     *
     * @protected
     * @template T
     * @template S
     * @param {number} id
     * @param {T} key
     * @param {(S | ((entry: K) => S))} payload
     * @returns {Promise<number>}
     * @memberof StashModule
     */
    protected async updateStateAndDb<T extends keyof Omit<K, 'id'>, S extends K[T]>(
        id: number,
        key: T,
        payload: S | ((entry: K) => S)
    ): Promise<number> {
        // if payload is a function, use it to get a value
        // if payload is value, wrap a function around it to return the payload value
        const getValue = payload instanceof Function ? payload : () => payload;

        return this.table.where({ id }).modify(dbEntry => {
            const stateEntry = this.get(dbEntry.id);
            // the entry might not exist in the state as it wasn't loaded; it's normal
            if (!stateEntry) return;

            const value = getValue(stateEntry);

            if (dbEntry[key] === value)
                return log.info(
                    `${this.moduleName}/updateStateAndDb: Db #${dbEntry.id}.${key} entry already has value ${value}.`
                );

            dbEntry[key] = stateEntry[key] = value;
        });
    }

    /**
     * Reset the state to its defaults.
     *
     * @memberof StashModule
     */
    reset(): void {
        Object.assign(this.state, new this.StateClass());
    }

    protected get moduleName(): string {
        return this.constructor.name.replace('Module', '').toLowerCase();
    }
}

export class CommonStashModule<K extends DBCommonEntry, T extends StashModuleState<K>> extends StashModule<K, T> {
    // TODO: check if these can be moved to the main class
    /**
     * Return an active journal or throws an error if the active journal is not set or its root group is not set.
     *
     * @readonly
     * @protected
     * @type {Journal}
     * @memberof NonJournalStashModule
     */
    protected get activeJournal(): Journal | null {
        return this.$stash.journals.active;
    }

    protected async getFromDb(id: number): Promise<K | undefined> {
        const entry = await super.getFromDb(id);

        if (!this.activeJournal) throw new Error(`${this.moduleName}/getFromDb: Active journal is not set.`);

        return entry;
    }

    /**
     * Check if the supplied entry id is valid in the Db and belongs to the active journal.
     *
     * @param {number} id
     * @returns {Promise<boolean>}
     * @memberof CommonStashModule
     */
    async isValidInDb(id: number): Promise<boolean> {
        if (!this.activeJournal) throw new Error(`${this.moduleName}/isValidInDb: Active journal is not set.`);

        return isValidDBCommonEntry(this.table, { id, journalId: this.activeJournal.id });
    }

    /**
     * Check if the supplied entry id is valid in the State and belongs to the active journal.
     *
     * @param {number} id
     * @returns {boolean}
     * @memberof CommonStashModule
     */
    isValid(id: number): boolean {
        if (!this.activeJournal) throw new Error(`${this.moduleName}/isValid: Active journal is not set.`);

        const entry = this.get(id);

        return entry !== undefined && entry.journalId === this.activeJournal.id;
    }
}
