import { ActionContext, Store } from 'vuex';
import { getStoreAccessors } from 'vuex-typescript';

import gists from './../../../api/gists';
import storage from './../../../api/storage';

import {
    CollectionState,
    CollectionIndex,
    CollectionList,
    ListTree
} from './collection-state';
import { State as RootState } from './../../state';

import { gistIdSetting, gistFileNameSetting } from './../../../settings';
import { Word } from '../words/index';

type CollectionContext = ActionContext<CollectionState, RootState>;

const state: CollectionState = {
    index: { defaultListId: null, tree: [] },
    lists: [],

    selectedLists: [],
    selectedWords: []
};

// getters
// retuns Word collection from the WordsState store
const getters = {
    /* isImportOpen: (state: AppState): boolean => state.isImportOpen,
    isSettingsOpen: (state: AppState): boolean => state.isSettingsOpen */
};

// actions
const actions = {
    async initCollection(context: CollectionContext) {
        const hasCollection = await storage.hasCollection();

        if (!hasCollection) {
            console.log('init collection');
            const list = new CollectionList('default');
            const tree = new ListTree(list);

            state.lists.push(list);
            state.index.tree.push(tree);
            state.index.defaultListId = list.id;

            storage.initCollection(state);
        } else {
            console.log('collection exists');
        }

        const index = await storage.getIndex();
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
        storage.saveIndex(state.index);

        // gists.post2(state, gistIdSetting.get(), gistFileNameSetting.get());
    }
};

// mutations
const mutations = {
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

// action
export const dInitCollection = dispatch(actions.initCollection);

//mutations
/* export const cOpenImport = commit(mutations.openImport);
export const cOpenSettings = commit(mutations.openSettings); */
