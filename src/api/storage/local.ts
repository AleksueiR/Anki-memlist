import jsonStorage from 'electron-json-storage';

import Storage from './interface';
import {
    CollectionState,
    CollectionIndex,
    CollectionList,
    CollectionTree,
    CollectionIndexOptions,
    CollectionListOptions
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

        const listPromises = convertTreeToList(index.tree).map(listId =>
            this.loadList(listId)
        );
        const lists = await Promise.all(listPromises);

        return Promise.resolve(new CollectionState({ index, lists }));

        /**
         * Pre-order tree traversal visits each node using stack.
         * Checks if leaf node based on children === null otherwise
         * pushes all children into stack and continues traversal.
         *
         * @param {CollectionTree} root deserialized JSON root to begin traversal
         * @returns {string[]} final array of nodes in order
         */
        function convertTreeToList(root: CollectionTree): string[] {
            const stack: CollectionTree[] = [];
            const array: string[] = [];

            stack.push(root);

            while (stack.length !== 0) {
                const node = stack.pop()!;

                if (node.items.length === 0) {
                    array.push(node.listId);
                } else {
                    stack.push.apply(stack, node.items.slice().reverse());
                }
            }

            return array;
        }
    },

    saveCollection(state: CollectionState): Promise<void> {
        const promises: Promise<void>[] = state.lists.map(
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
                    // TODO: handle errors
                    resolve(new CollectionList(data));
                }
            );
        });

        return promise;
    }
};

export default local;
