import { DBCommonEntry, DBEntry, Journal, isValidDBCommonEntry } from '@/api/db';
import { exceptArray, notEmptyFilter, wrapInArray } from '@/util';
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

    protected has(id: number): boolean {
        return this.state.all[id] !== undefined;
    }

    protected add(value: K): void {
        if (this.all[value.id]) throw new Error(`${this.moduleName}/put: Entry ${value.id} already exists.`);

        this.state.all[value.id] = value;
    }

    protected put(value: K): void {
        this.state.all[value.id] = value;
    }

    /**
     * Remove the provided value from the `state.all` set.
     *
     * @protected
     * @param {(K | K[])} values
     * @returns {void}
     * @memberof StashModule
     */
    protected removeFromAll(value: K | number): void;
    protected removeFromAll(values: K[] | number[]): void;
    protected removeFromAll(value: K | K[] | number | number[]): void {
        if (Array.isArray(value)) {
            return value.forEach((v: K | number) => this.removeFromAll(v));
        }

        delete this.all[typeof value === 'number' ? value : value.id];
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
     * Remove the specified Entry from the db.
     *
     * @protected
     * @param {(number | number[])} id
     * @returns {Promise<void>}
     * @memberof StashModule
     */
    protected async deleteFromDb(id: number | number[]): Promise<void> {
        await this.table.bulkDelete(wrapInArray(id));
    }

    /**
     * Get an Entry (or a list of Entries) with the id specified from the state.
     *
     * @param {(number | number[])} value
     * @returns {(K | undefined | K[])}
     * @memberof StashModule
     */
    get(id: number): K | undefined {
        return this.state.all[id];
    }

    /**
     * Update a specified record in the entry set and update the corresponding record in the db.
     * Returns the number of entries updated; 0 if no entries were updated:
     * - the number of provided ids and values doesn't match
     * - an entry doesn't exist
     * - an entry already has the value provided
     *
     * @protected
     * @template T
     * @template S
     * @param {(number | number[])} ids
     * @param {T} key
     * @param {(S | S[] | ((entry: K) => S))} payload
     * @returns {Promise<number>}
     * @memberof StashModule
     */
    protected async updateStateAndDb<T extends keyof Omit<K, 'id'>, S extends K[T]>(
        id: number,
        key: T,
        payload: S | ((entry: K) => S)
    ): Promise<number>;
    protected async updateStateAndDb<T extends keyof Omit<K, 'id'>, S extends K[T]>(
        ids: number[],
        key: T,
        payload: S[] | ((entry: K) => S)
    ): Promise<number>;
    protected async updateStateAndDb<T extends keyof Omit<K, 'id'>, S extends K[T]>(
        ids: number | number[],
        key: T,
        payload: S | S[] | ((entry: K) => S)
    ): Promise<number> {
        if (Array.isArray(ids) && Array.isArray(payload) && ids.length !== payload.length)
            throw new Error(
                `${this.moduleName}/updateStateAndDb: The number of supplied ids and values doesn't match.`
            );

        // if payload is a function, use it to get a value
        // if payload is value or value[], wrap a function around it to return value by index
        const getValue =
            payload instanceof Function
                ? payload
                : (() => {
                      const idList = wrapInArray(ids);
                      const valueList = isPayloadAnArray(payload) ? payload : [payload];

                      return (entry: K) => valueList[idList.indexOf(entry.id)];
                  })();

        return this.table
            .where('id')
            .anyOf(ids)
            .modify(dbEntry => {
                const stateEntry = this.get(dbEntry.id);
                // the entry might not exist in the state as it wasn't loaded; it's normal
                if (!stateEntry) return;
                // throw new Error(`${this.moduleName}/updateStateAndDb: State #${dbEntry.id} entry doesn't exist.`);

                const value = getValue(stateEntry);

                if (dbEntry[key] === value)
                    return log.info(
                        `${this.moduleName}/updateStateAndDb: Db #${dbEntry.id}.${key} entry already has value ${value}.`
                    );

                dbEntry[key] = stateEntry[key] = value;
            });

        /**
         * Check if the `payload` an array of values `S`. This will only be true if `ids` is an array as well.
         * The payload can be an array itself as a single value, but then `ids` must be a single number.
         *
         * @param {(S | S[])} x
         * @returns {x is S[]}
         */
        function isPayloadAnArray(x: S | S[]): x is S[] {
            return Array.isArray(ids);
        }
    }

    /**
     * Reset the state to its defaults.
     *
     * @memberof StashModule
     */
    reset(): void {
        Object.assign(this.state, new this.StateClass());
    }

    get moduleName(): string {
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

    /**
     * Delete all entries belonging to the specified journal, even if these entries are not currently loaded.
     * If the specified journal is currently active, reset the state of the stash module.
     *
     * @param {number} journalId
     * @returns {Promise<void>}
     * @memberof NonJournalStashModule
     */
    async deleteJournalEntries(journalId: number): Promise<void> {
        await this.table.where({ journalId }).delete();

        // reset the state of the stash module of the active journal is being deleted
        if (journalId === this.$stash.journals.activeId) {
            this.reset();
        }
    }
}

//
/* export type AbstractUpdater<K = any> = <T extends keyof Omit<K, 'id'>, S extends K[T]>(
    id: number, key: T, value: S, all?: Record<number, K> ) => void; */

/* export type GenericUpdater = <T extends keyof Omit<K, 'id'>, S extends K[T], K>(
    all: Record<number, K>,
    table: Table,
    id: number,
    key: T,
    value: S
) => Promise<void>; */
