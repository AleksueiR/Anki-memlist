import { Stash } from './internal';
import { Table } from 'dexie';

export type GenericUpdater = <T extends keyof Omit<K, 'id'>, S extends K[T], K>(
    all: Record<number, K>,
    table: Table,
    id: number,
    key: T,
    value: S
) => Promise<void>;

export type SpecificUpdater<K> = <T extends keyof Omit<K, 'id'>, S extends K[T]>(id: number, key: T, value: S) => void;

export class StashModule {
    protected readonly $stash: Stash;

    constructor(stash: Stash) {
        // mark $stash as not enumerable so Vue doesn't make it reactive
        Object.defineProperty(this, '$stash', {
            value: stash,
            enumerable: false,
            writable: false
        });
    }
}

/**
 *
 *
 * @param {*} all
 * @param {*} table
 * @param {*} id
 * @param {*} key
 * @param {*} value
 * @returns {Promise<void>}
 */
export const $updateGenericStateAndDb: GenericUpdater = async (all, table, id, key, value): Promise<void> => {
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
    return table.update(id, { [key]: value }).then(result => {
        // if result === 0, either the id is wrong or the value is already set
        if (result === 0) {
            console.error(`${id} failed to update db: id doesn't exist or value is already set`);
        }
    });
};

//
/* export type AbstractUpdater<K = any> = <T extends keyof Omit<K, 'id'>, S extends K[T]>(
    id: number, key: T, value: S, all?: Record<number, K> ) => void; */
