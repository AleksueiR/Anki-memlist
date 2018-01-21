import { ActionContext, Store } from 'vuex';
import { getStoreAccessors } from 'vuex-typescript';

import gists from './../../../api/gists';

import { CollectionState, WordList, ListTree } from './collection-state';
import { State as RootState } from './../../state';

import { gistIdSetting, gistFileNameSetting } from './../../../settings';

type CollectionContext = ActionContext<CollectionState, RootState>;

const state: CollectionState = {
    lists: [],

    tree: [],
    defaultListId: null,

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
    initCollection(context: CollectionContext) {
        console.log('init collection');
        const list = new WordList('default');
        const tree = new ListTree(list);

        state.lists.push(list);
        state.tree.push(tree);
        state.defaultListId = list.id;

        gists.post2(state, gistIdSetting.get(), gistFileNameSetting.get());
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
