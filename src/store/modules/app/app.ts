import { ActionContext, Store } from 'vuex';
import { getStoreAccessors } from 'vuex-typescript';

import { AppState } from './app-state';
import { State as RootState } from './../../state';

type AppContext = ActionContext<AppState, RootState>;

const state: AppState = {
    isImportOpen: false,
    isSettingsOpen: false
};

// getters
// retuns Word collection from the WordsState store
const getters = {
    isImportOpen: (state: AppState): boolean => state.isImportOpen,
    isSettingsOpen: (state: AppState): boolean => state.isSettingsOpen
};

// actions
const actions = {};

// mutations
const mutations = {
    openImport(state: AppState, value: boolean): void {
        state.isImportOpen = value;
    },

    openSettings(state: AppState, value: boolean): void {
        state.isSettingsOpen = value;
    }
};

export const app = {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};

const { commit, read, dispatch } = getStoreAccessors<AppState, RootState>(
    'app'
);

// getter
export const rIsImportOpen = read(getters.isImportOpen);
export const rIsSettingsOpen = read(getters.isSettingsOpen);

// action
// export const dSyncWords = dispatch(actions.syncWords);

//mutations
export const cOpenImport = commit(mutations.openImport);
export const cOpenSettings = commit(mutations.openSettings);
