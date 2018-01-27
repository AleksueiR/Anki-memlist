import { ActionContext, Store } from 'vuex';

import storage from './../../../api/storage';
import {
    CollectionState,
    CollectionIndex,
    CollectionList,
    CollectionTree,
    CollectionWord
} from './collection-state';
import { State as RootState } from './../../state';
import { isArray } from 'util';

type CollectionContext = ActionContext<CollectionState, RootState>;

const state: CollectionState = new CollectionState();

// getters
const getters = {
    getPooledWords: (state: CollectionState): CollectionWord[] => {
        const pooledWords = (<CollectionWord[]>[]).concat(
            ...state.selectedLists.map(list => list.words)
        );

        /* state.selectedLists.reduce((pooledWords: CollectionWord[], selectedList: CollectionList) => {
            return pooledWords.concat(selectedList.words)
        },[]); */

        return pooledWords;
    }
};

// actions
const actions = {
    async fetchIndex(context: CollectionContext): Promise<void> {
        let index: CollectionIndex = state.index;

        const hasCollection = await storage.hasCollection();

        if (!hasCollection) {
            actions.writeCollection(context);
        } else {
            index = await storage.loadIndex();
        }

        context.commit('SET_INDEX', index);

        if (state.index.defaultListId !== null) {
            actions.fetchList(context, state.index.defaultListId);
        }
    },

    async fetchList(context: CollectionContext, listId: string): Promise<void> {
        let list: CollectionList = await storage.loadList(listId);

        if (!list) {
            return;
        }

        context.commit('SET_LIST', list);
    },

    writeCollection(context: CollectionContext): void {
        storage.saveCollection(state);
    },

    writeIndex(context: CollectionContext): void {
        storage.saveIndex(state.index);
    },

    /**
     *
     *
     * @param {CollectionContext} context
     * @param {(CollectionList | CollectionList[])} list
     * @param {boolean} [writeIndex=false] if `true`, the collection index will be written as well
     */
    writeList(
        context: CollectionContext,
        list: CollectionList | CollectionList[],
        writeIndex: boolean = false
    ): void {
        if (writeIndex) {
            actions.writeIndex(context);
        }

        if (isArray(list)) {
            list.forEach(l => storage.saveList(l));
        }

        // TODO: use a guard check
        storage.saveList(list as CollectionList);
    },

    addList(context: CollectionContext, list: CollectionList): void {
        context.commit('SET_LIST_POSITION', { tree: state.index.tree, list });
        context.commit('SET_LIST', list);

        if (!state.index.defaultListId) {
            context.commit('SET_DEFAULT_LIST', list);
        }

        actions.writeList(context, list, true);
    },

    async selectList(
        context: CollectionContext,
        listId: string
    ): Promise<void> {
        /* let list: CollectionList | null = getters.getList(
            context.state,
            listId
        );

        if (!list) {
            list = await storage.loadList(listId);
            cSTORE_LIST(context, list);
        }

        cSELECT_LIST(context, list); */
    },

    deselectList(context: CollectionContext, listId: string): void {
        /* let list: CollectionList | null = getters.getList(
            context.state,
            listId
        );

        if (!list) {
            return;
        }
        cDESELECT_LIST(context, list); */
    },

    /* loadList(context: CollectionContext, listId: string): CollectionList {
        storage.loadList(listId)
    }, */

    async initCollection(context: CollectionContext) {
        const hasCollection = await storage.hasCollection();

        if (!hasCollection) {
            console.log('init collection');

            const collectionIndex = state.index;

            const list = new CollectionList({ name: 'default' });
            state.lists.push(list);
            collectionIndex.tree.addList(list);
            collectionIndex.defaultListId = list.id;

            storage.saveCollection(state);
        } else {
            console.log('collection exists');
        }

        const loadedState = await storage.loadCollection();
        state.index = loadedState.index;
        state.lists = loadedState.lists;

        state.lists[0].addWord(
            new CollectionWord({ text: 'word' + new Date().getMilliseconds() })
        );
        storage.saveList(state.lists[0]);

        console.log('state2', loadedState);
        /* const index = await storage.getIndex();
        const list = await storage.getList(index.defaultListId!);

        state.index = index;
        state.lists.push(list);

        console.log('index', index, 'list', list);

        list.words.push(new Word({ text: 'sfs' }));
        storage.saveList(list);

        const newList = new CollectionList('new list');
        const tr = state.index.tree.find(
            tree => tree.listId === list.id
        ) as ListTree;
        tr.items.push(new ListTree(newList));
        storage.saveList(newList);
        storage.saveIndex(state.index); */

        // gists.post2(state, gistIdSetting.get(), gistFileNameSetting.get());
    }
};

// mutations
const mutations = {
    SET_INDEX(state: CollectionState, index: CollectionIndex): void {
        state.index = index;
    },

    SET_LIST(state: CollectionState, list: CollectionList): void {
        state.lists.push(list);
    },

    SET_DEFAULT_LIST(state: CollectionState, list: CollectionList): void {
        state.index.defaultListId = list.id;
    },

    SET_LIST_POSITION(
        state: CollectionState,
        { tree, list }: { tree: CollectionTree; list: CollectionList }
    ): void {
        tree.addList(list);
    },

    SELECT_LIST(state: CollectionState, list: CollectionList): void {
        state.selectedLists.push(list);
    },

    DESELECT_LIST(state: CollectionState, list: CollectionList): void {
        const index = state.selectedLists.indexOf(list);

        state.selectedLists.splice(index, 1);
    }

    /* openImport(state: AppState, value: boolean): void {
        state.isImportOpen = value;
    },

    openSettings(state: AppState, value: boolean): void {
        state.isSettingsOpen = value;
    } */
};

export const collection = {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
