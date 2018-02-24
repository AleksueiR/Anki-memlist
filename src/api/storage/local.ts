import jsonStorage from 'electron-json-storage';

import Storage from './interface';
import {
    CollectionState,
    CollectionIndex,
    CollectionList,
    CollectionTree,
    CollectionIndexOptions,
    CollectionListOptions,
    CollectionWord,
    CollectionListMap
} from '../../store/modules/collection/index';

/* console.log('padht', jsonStorage.getDataPath());
console.log('defautl path', jsonStorage.getDefaultDataPath());
 */

function indexFileName(): string {
    return 'index.json';
}

function listFileName(id: string): string {
    return `list-${id}.json`;
}

const local: Storage = {
    id: 'local',

    hasCollection() {
        const promise = new Promise<boolean>((resolve, reject) => {
            jsonStorage.has(indexFileName(), (error, hasKey) => {
                resolve(hasKey);
            });
        });

        return promise;
    },

    async loadCollection(): Promise<CollectionState> {
        const index = await this.loadIndex();

        const listPromises = index.flatTree.map(listId =>
            this.loadList(listId)
        );

        const listArray = await Promise.all(listPromises);
        const lists: CollectionListMap = listArray.reduce(
            (map: CollectionListMap, list) => {
                map[list.id] = list;
                return map;
            },
            {}
        );
        /* const lists = new Map(
            listArray.map<[string, CollectionList]>(list => [list.id, list])
        ); */

        return Promise.resolve(new CollectionState({ index, lists }));
    },

    saveCollection(state: CollectionState): Promise<void> {
        /* const promises: Promise<void>[] = Array.from(state.lists.values()).map(
            (list: CollectionList) => local.saveList(list)
        ); */

        const promises: Promise<void>[] = Object.values(state.lists).map(
            (list: CollectionList) => local.saveList(list)
        );

        promises.push(local.saveIndex(state.index));

        // TODO: handle errors
        return Promise.all(promises).then(() => Promise.resolve());
    },

    saveIndex(index: CollectionIndex): Promise<void> {
        const promise = new Promise<void>((resolve, reject) => {
            jsonStorage.set(indexFileName(), index.safeJSON, error => {
                // TODO: handle errors
                resolve();
            });
        });

        return promise;
    },

    saveList(list: CollectionList): Promise<void> {
        const promise = new Promise<void>((resolve, reject) => {
            jsonStorage.set(listFileName(list.id), list.safeJSON, error => {
                // TODO: handle errors
                resolve();
            });
        });

        return promise;
    },

    loadIndex(): Promise<CollectionIndex> {
        const promise = new Promise<CollectionIndex>((resolve, reject) => {
            jsonStorage.get(
                indexFileName(),
                (error, data: CollectionIndexOptions) => {
                    // TODO: handle errors
                    resolve(new CollectionIndex(data));
                }
            );
        });

        return promise;
    },

    loadList(listId: string): Promise<CollectionList> {
        const promise = new Promise<CollectionList>((resolve, reject) => {
            jsonStorage.get(
                listFileName(listId),
                (error, data: CollectionListOptions) => {
                    // convert word dictionary into a proper Map of CollectionWord object
                    /* data.words = new Map(
                        Array.from(Object.values(data.words)).map<
                            [string, CollectionWord]
                        >(word => [word.id, new CollectionWord(word)])
                    ); */

                    /* data.words = new Map(
                        Array.from(Object.values(data.words)).map<
                            [string, CollectionWord]
                        >(word => [word.id, new CollectionWord(word)])
                    ); */

                    // TODO: handle errors
                    resolve(new CollectionList(data));
                }
            );
        });

        return promise;
    }
};

export default local;
