import pathify from '@/pathify';
import Vue from 'vue';
import Vuex from 'vuex';
import { app } from './modules/app';
import { collection } from './modules/collection';
import { display } from './modules/display';
import { groups } from './modules/groups';
import { journals } from './modules/journals';
import { words } from './modules/words';
import { RootState } from './state';

Vue.use(Vuex);

// ???
// const debug = true; //process.env.NODE_ENV !== 'production'

export const createStore = () =>
    new Vuex.Store<RootState>({
        plugins: [pathify.plugin],
        modules: {
            app,
            collection,
            display,
            journals,
            groups,
            words
        }
    });

/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'vuex' {
    // declare augmentation for Vuex store for Pathify
    interface Store<S> {
        // set<T = void>(path: 'journals/all' | 'journals/activeId', value: any): Promise<T>;
        set<K = any>(path: string, value?: K): Promise<void>;

        get: <T>(path: string, ...args: any) => T;

        copy: <T>(path: string, ...args: any) => T | undefined;
    }
}

/* export const storeX = {
    debug: true,
    state: {
        message: 'Hello!'
    },
    setMessageAction(newValue: any) {
        if (this.debug) console.log('setMessageAction triggered with', newValue);
        this.state.message = newValue;
    },
    clearMessageAction() {
        if (this.debug) console.log('clearMessageAction triggered');
        this.state.message = '';
    }
}; */
