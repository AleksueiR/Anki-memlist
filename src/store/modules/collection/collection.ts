import { ActionContext, Store } from 'vuex';
import { getStoreAccessors } from 'vuex-typescript';

import gists from './../../../api/gists';
import storage from './../../../api/storage';

import {
    CollectionState,
    CollectionIndex,
    CollectionList,
    CollectionTree
} from './collection-state';
import { State as RootState } from './../../state';

import { CollectionWord } from './index';

type CollectionContext = ActionContext<CollectionState, RootState>;

const state: CollectionState = new CollectionState();

// getters
const getters = {
    /* isImportOpen: (state: AppState): boolean => state.isImportOpen,
    isSettingsOpen: (state: AppState): boolean => state.isSettingsOpen */

    // collectionIndex: (state: CollectionState): CollectionState => state,
    getIndex: (state: CollectionState): CollectionIndex => state.index,
    // getLists: (state: CollectionState): CollectionList[] => state.lists,

    getLists: (state: CollectionState): CollectionList[] => state.lists,

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
    async fetchCollectionIndex(context: CollectionContext): Promise<void> {
        const hasCollection = await storage.hasCollection();

        if (!hasCollection) {
            dStashCollection(context);
        } else {
            console.log('collection exists');
        }
    },

    stashCollection(context: CollectionContext): void {
        storage.saveCollection(state);
    },

    async selectList(
        context: CollectionContext,
        listId: string
    ): Promise<void> {
        let list: CollectionList | null = getters.getList(
            context.state,
            listId
        );

        if (!list) {
            list = await storage.loadList(listId);
            cSTORE_LIST(context, list);
        }

        cSELECT_LIST(context, list);
    },

    deselectList(context: CollectionContext, listId: string): void {
        let list: CollectionList | null = getters.getList(
            context.state,
            listId
        );

        if (!list) {
            return;
        }
        cDESELECT_LIST(context, list);
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

const { commit, read, dispatch } = getStoreAccessors<
    CollectionState,
    RootState
>('collection');

// getter
/* export const rIsImportOpen = read(getters.isImportOpen);
export const rIsSettingsOpen = read(getters.isSettingsOpen); */
//export const rCollectionIndex = read(getters.collectionIndex);
export const rGetIndex = read(getters.getIndex);
export const rGetList = read(getters.getLists);
export const rGetPooledWords = read(getters.getPooledWords);

// action
export const dInitCollection = dispatch(actions.initCollection);

export const dStashCollection = dispatch(actions.stashCollection);

//mutations
/* export const cOpenImport = commit(mutations.openImport);
export const cOpenSettings = commit(mutations.openSettings); */
const cSELECT_LIST = commit(mutations.SELECT_LIST);
const cDESELECT_LIST = commit(mutations.DESELECT_LIST);
