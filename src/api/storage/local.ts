import jsonStorage from 'electron-json-storage';

import Storage from './interface';
import {
    CollectionState,
    CollectionIndex,
    CollectionList,
    // CollectionTree,
    CollectionIndexOptions,
    CollectionListOptions,
    CollectionWord,
    CollectionListMap,
    CollectionWordOptions,
    CollectionWordMap
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

        const listPromises = index.flatTree.map(listId => this.loadList(listId));

        const listArray = await Promise.all(listPromises);
        const lists: CollectionListMap = listArray.reduce((map: CollectionListMap, list) => {
            map[list.id] = list;
            return map;
        }, {});

        return new CollectionState({ index, lists });
    },

    saveCollection(state: CollectionState): Promise<void> {
        /* const promises: Promise<void>[] = Array.from(state.lists.values()).map(
            (list: CollectionList) => local.saveList(list)
        ); */

        const promises: Promise<void>[] = Object.values(state.lists).map((list: CollectionList) =>
            local.saveList(list)
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
                console.log('save list', list.id, list.safeJSON);

                resolve();
            });
        });

        return promise;
    },

    /**
     * Loads the collection index file.
     *
     * @returns {Promise<CollectionIndex>} collection index
     */
    loadIndex(): Promise<CollectionIndex> {
        // TODO: handle errors
        const promise = new Promise<CollectionIndex>((resolve, reject) => {
            jsonStorage.get(indexFileName(), (error, data: CollectionIndexOptions) =>
                resolve(new CollectionIndex(data))
            );
        });

        return promise;
    },

    loadList(listId: string): Promise<CollectionList> {
        const promise = new Promise<CollectionList>((resolve, reject) => {
            jsonStorage.get(listFileName(listId), (error, data: CollectionListOptions) => {
                // convert word dictionary into a proper Map of CollectionWord object
                // type words in the dictionary

                data.words = Object.values(data.words!).reduce(
                    (map: CollectionWordMap, wordOptions: CollectionWordOptions) => {
                        const word = new CollectionWord(wordOptions);
                        map[word.id] = word;
                        return map;
                    },
                    {}
                );

                // TODO: handle errors
                resolve(new CollectionList(data));
            });
        });

        return promise;
    },

    deleteList(listId: string): Promise<void> {
        const promise = new Promise<void>((resolve, reject) => {
            jsonStorage.remove(listFileName(listId), error => {
                // TODO: handle errors
                console.log('delete list', listId);

                resolve();
            });
        });

        return promise;
    }
};

export default local;
