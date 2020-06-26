import { DBEntry, DBNonJournalEntry, Journal } from '@/api/db';
import { notEmptyFilter, wrapInArray } from '@/util';
import { Table } from 'dexie';
import log from 'loglevel';
import { Stash } from './internal';

export enum SelectionMode {
    Replace = 0,
    Add = 1,
    Remove = 2
}

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
            return value.map(value => this.addToAll(value));
        }

        if (this.all[value.id]) return log.info(`record/addToAll: Entry ${value.id} already exists.`), 0;

        this.setAll({ ...this.all, ...{ [value.id]: value } });
    }

    /**
     * Remove the provided value from the `state.all` set.
     *
     * @protected
     * @param {(K | K[])} values
     * @returns {void}
     * @memberof StashModule
     */
    protected removeFromAll(value: K): void;
    protected removeFromAll(values: K[]): void;
    protected removeFromAll(value: K | K[]): void {
        if (Array.isArray(value)) {
            return value.forEach(this.removeFromAll);
        }

        delete this.all[value.id];
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
    protected async getFromDb(id: number): Promise<K | undefined> {
        const record = await this.table.get(id);
        if (!record) log.warn(`record/getFromDb: Cannot load or record ${id} doesn't exist.`);

        return record;
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

        const entry = this.state.all[value];
        if (!entry) log.warn(`record/get: Cannot load or record ${value} doesn't exist.`);

        return this.state.all[value];
    }

    /**
     * Vet a list of supplied ids against the loaded entries.
     * Use to filter out externally supplied ids.
     *
     * // TODO: maybe combine with `isValid` function
     * @protected
     * @param {number[]} [value]
     * @returns {number[]}
     * @memberof StashModule
     */
    protected vetIds(value: number | number[]): number[] {
        const ids = wrapInArray(value);
        const allIds = this.getAllIds();

        // either filter the the provided list to make sure there are no phony ids or return all of them if `ids` is not provided.
        // this also filters out duplicates
        return allIds.filter(id => ids.includes(id));
    }

    /**
     * Update a specified record in the entry set and update the corresponding record in the db.
     * Returns 0 on error or if the value is already set.
     *
     * @param {*} id
     * @param {*} key
     * @param {*} value
     * @returns {Promise<void>}
     */
    updateStateAndDb: SpecificUpdater<K> = async (id, key, value) => {
        const entry = this.get(id);
        if (!entry) return 0;

        // value is already set
        if (entry[key] === value) {
            return log.info(`record/updateStateAndDb: ${id}.${key} already has value ${value}`), 0;
        }

        // set the value in the state
        entry[key] = value;

        // update the db
        return this.table.update(id, { [key]: value }).then(result => {
            // if result === 0, either the id is wrong or the value is already set
            if (result === 0) {
                log.error(`${id} failed to update db: id doesn't exist or value is already set`);

                return 0;
            }
        });
    };

    /**
     * Reset the state to its defaults.
     *
     * @memberof StashModule
     */
    reset(): void {
        Object.assign(this.state, new this.StateClass());
    }
}

export class NonJournalStashModule<K extends DBNonJournalEntry, T extends StashModuleState<K>> extends StashModule<
    K,
    T
> {
    /**
     * Return an active journal or undefined if the active journal is not set.
     *
     * @protected
     * @returns {(Journal | undefined)}
     * @memberof WordsModule
     */
    protected getActiveJournal(): Journal | undefined {
        const activeJournal = this.$stash.journals.active;
        if (!activeJournal) return log.warn('record/getActiveJournal: Active journal is not set'), undefined;

        if (activeJournal.rootGroupId <= 0) log.warn('record: Root Group of the Active journal is not set'), undefined;

        return activeJournal;
    }

    /**
     * Check if the supplied non-journal entry id is valid and belongs to the active journal.
     * If at least one id is not valid, return `false`.
     *
     * @param {number} id
     * @returns {boolean}
     * @memberof WordsModule
     */
    isValid(value: number | number[]): boolean {
        if (Array.isArray(value)) {
            return value.every(id => this.isValid(id));
        }

        const activeJournal = this.getActiveJournal();
        if (!activeJournal) return false;

        const entry = this.get(value);
        if (!entry) return false;

        if (entry.journalId !== activeJournal.id) {
            log.warn(`record/isValid: Word ${value} doesn't belong to Journal ${activeJournal.id}.`);
            return false;
        }

        return true;
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
