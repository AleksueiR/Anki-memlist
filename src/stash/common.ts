import { DBCommonEntry, DBEntry, Journal } from '@/api/db';
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

type OmitId<K extends DBEntry> = keyof Omit<K, 'id'>;

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

    /**
     * Set a collection of all entries.
     *
     * @protected
     * @param {EntrySet<K>} value
     * @memberof StashModule
     */
    protected setAll(value: EntrySet<K>): void {
        this.state.all = value;
    }

    /**
     * Add the provided value or a list of values to the `state.all` set.
     * Return 0 on failure; returns void on success.
     *
     * @protected
     * @param {(K | K[])} values
     * @returns {(void | 0 | (void | 0)[])}
     * @memberof StashModule
     */
    protected addToAll(value: K): void | 0;
    protected addToAll(values: K[]): (void | 0)[];
    protected addToAll(value: K | K[]): void | 0 | (void | 0)[] {
        if (Array.isArray(value)) {
            return value.map(entry => this.addToAll(entry));
        }

        if (this.all[value.id]) return log.info(`${this.moduleName}/addToAll: Entry ${value.id} already exists.`), 0;

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
     * Return ids of the `all` collection.
     *
     * @returns {number[]}
     * @memberof StashModule
     */
    protected getAllIds(): number[] {
        return Object.keys(this.all).map(k => +k);
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
    protected async _getFromDb(id: number): Promise<K | undefined>;
    protected async _getFromDb(ids: number[]): Promise<K[] | undefined>;
    protected async _getFromDb(value: number | number[]): Promise<K | K[] | undefined> {
        const records = await this.table.bulkGet(wrapInArray(value));
        if (!records) log.warn(`${this.moduleName}/getFromDb: Cannot load or record ${value} doesn't exist.`);

        if (Array.isArray(value)) {
            return records.pop();
        }

        return records;
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
     * Throws an error if the id is not valid.
     *
     * @param {(number | number[])} value
     * @returns {(K | undefined | K[])}
     * @memberof StashModule
     */
    get(id: number): K | undefined;
    get(ids: number[]): K[];
    get(value: number | number[]): K | undefined | K[] {
        if (Array.isArray(value)) {
            return value.map(id => this.get(id)).filter(notEmptyFilter);
        }

        return this.state.all[value];
    }

    /**
     * Vet a list of supplied ids against the loaded entries.
     * Use to filter out externally supplied ids.
     *
     * @param {(number | number[])} value
     * @returns {number[]}
     * @memberof StashModule
     */
    vetId(value: number | number[]): number[] {
        // make return a promise for consistency
        const ids = [...new Set(wrapInArray(value))]; // remove duplicates

        // either filter the the provided list to make sure there are no phony ids or return all of them if `ids` is not provided.
        // this also filters out duplicates
        return this.getAllIds().filter(id => ids.includes(id));
    }

    /**
     * Check if the supplied id or ids are valid.
     * If at least one ids is not valid, return `false`.
     *
     * @param {(number | number[])} value
     * @returns {boolean}
     * @memberof StashModule
     */
    isValidId(value: number | number[]): boolean {
        const ids = wrapInArray(value);

        // it's assumed that if an entry has been added to the `state.all`, the entry is valid
        // as only the internal stash functions can write to `state.all`

        // vet ids and if all the ids are found in the collection return true
        return this.vetId(ids).length === ids.length;
    }

    validateId(value: number | number[]): void {
        const invalidIds = exceptArray(wrapInArray(value), this.getAllIds());

        if (invalidIds.length > 0)
            throw new Error(`${this.moduleName}/validateId: Entry id/ids #${invalidIds} are invalid in this context.`);
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
                if (!stateEntry)
                    throw new Error(`${this.moduleName}/updateStateAndDb: State #${dbEntry.id} entry doesn't exist.`);

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
    /**
     * Return an active journal or throws an error if the active journal is not set or its root group is not set.
     *
     * @readonly
     * @protected
     * @type {Journal}
     * @memberof NonJournalStashModule
     */
    protected get activeJournal(): Journal {
        const activeJournal = this.$stash.journals.active;
        if (!activeJournal) throw new Error(`${this.moduleName}/getActiveJournal: Active journal is not set.`);

        if (activeJournal.rootGroupId === -1)
            throw new Error(`${this.moduleName}/getActiveJournal: Root Group of the Active journal is not set.`);

        return activeJournal;
    }

    /**
     * Return an active journal or throws if the active journal is not set or its root group is not set.
     *
     * @protected
     * @returns {(Journal)}
     * @memberof NonJournalStashModule
     */
    protected getActiveJournal(): Journal {
        const activeJournal = this.$stash.journals.active;
        if (!activeJournal) throw new Error(`${this.moduleName}/getActiveJournal: Active journal is not set.`);

        if (activeJournal.rootGroupId === -1)
            throw new Error(`${this.moduleName}/getActiveJournal: Root Group of the Active journal is not set.`);

        return activeJournal;
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
