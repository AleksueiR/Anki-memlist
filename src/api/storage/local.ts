import jsonStorage from 'electron-json-storage';

import Storage from './interface';
import {
    CollectionState,
    CollectionIndex,
    CollectionList
} from '../../store/modules/collection/index';

/* console.log('padht', jsonStorage.getDataPath());
console.log('defautl path', jsonStorage.getDefaultDataPath());
 */

const indexFileName: string = 'index.json';

const local: Storage = {
    id: 'local',

    hasCollection() {
        const promise = new Promise<boolean>((resolve, reject) => {
            jsonStorage.has(indexFileName, (error, hasKey) => {
                resolve(hasKey);
            });
        });

        return promise;
    },

    initCollection(state: CollectionState): Promise<void> {
        const promises: Promise<void>[] = state.lists.map(
            (list: CollectionList) => local.saveList(list)
        );
        promises.push(local.saveIndex(state.index));

        // TODO: handle errors
        return Promise.all(promises).then(() => Promise.resolve());
    },

    saveIndex(index: CollectionIndex): Promise<void> {
        const promise = new Promise<void>((resolve, reject) => {
            jsonStorage.set(indexFileName, index, error => {
                // TODO: handle errors
                resolve();
            });
        });

        return promise;
    },

    saveList(list: CollectionList): Promise<void> {
        const promise = new Promise<void>((resolve, reject) => {
            jsonStorage.set(`${list.id}.json`, list, error => {
                // TODO: handle errors
                resolve();
            });
        });

        return promise;
    },

    getIndex(): Promise<CollectionIndex> {
        const promise = new Promise<CollectionIndex>((resolve, reject) => {
            jsonStorage.get(indexFileName, (error, data: CollectionIndex) => {
                // TODO: handle errors
                resolve(data);
            });
        });

        return promise;
    },

    getList(listId: string): Promise<CollectionList> {
        const promise = new Promise<CollectionList>((resolve, reject) => {
            jsonStorage.get(`${listId}.json`, (error, data: CollectionList) => {
                // TODO: handle errors
                resolve(data);
            });
        });

        return promise;
    }
};

export default local;
