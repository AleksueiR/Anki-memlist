import { ActionContext, Store } from 'vuex';

import storage from '@/api/storage';
import { AppState } from './app-state';
import { RootState } from '@/store/state';

type AppContext = ActionContext<AppState, RootState>;

const state: AppState = {
    isCollectionViewOpen: true
};

enum Action {
    openCollectionView = 'openCollectionView'
}

enum Mutation {
    SET_COLLECTION_VIEW_OPEN_STATE = 'SET_COLLECTION_VIEW_OPEN_STATE'
}

const getters = {};

const actions = {
    [Action.openCollectionView](context: AppContext, { value }: { value: boolean }): void {
        context.commit(Mutation.SET_COLLECTION_VIEW_OPEN_STATE, { value });
    }
};

const mutations = {
    [Mutation.SET_COLLECTION_VIEW_OPEN_STATE](state: AppState, { value }: { value: boolean }): void {
        state.isCollectionViewOpen = value;
    }
};

export const app = {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
