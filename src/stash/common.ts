import { Table } from 'dexie';
import { Stash } from './internal';

export type SpecificUpdater<K> = <T extends keyof Omit<K, 'id'>, S extends K[T]>(id: number, key: T, value: S) => void;

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
export class StashModule<K, T extends StashModuleState<K>> {
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
     * Get an Entry with the id specified directly from the db.
     *
     * @protected
     * @param {number} id
     * @returns {Promise<K>}
     * @memberof StashModule
     */
    protected async getFromDb(id: number): Promise<K> {
        const record = await this.table.get(id);
        if (!record) throw new Error('record/getFromDb: Cannot load record.');

        return record;
    }

    /**
     * Update a specified record in the entry set and update the corresponding record in the db.
     *
     * @param {*} id
     * @param {*} key
     * @param {*} value
     * @returns {Promise<void>}
     */
    updateStateAndDb: SpecificUpdater<K> = async (id, key, value): Promise<void> => {
        const all = this.state.all;

        // check that id is valid
        if (!all[id]) {
            console.error(`${id} doest exist`);
            return;
        }

        // value is already set
        if (all[id][key] === value) {
            return;
        }

        // set the value in the state
        all[id][key] = value;

        // update the db
        return this.table.update(id, { [key]: value }).then(result => {
            // if result === 0, either the id is wrong or the value is already set
            if (result === 0) {
                console.error(`${id} failed to update db: id doesn't exist or value is already set`);
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
