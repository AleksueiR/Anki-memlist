import pathify from '@/pathify';

import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';

import { app } from './modules/app';
import { collection } from './modules/collection';
import { display } from './modules/display';
import { journals } from './modules/journals';
import { groups } from './modules/groups';
import { words } from './modules/words';

import { RootState } from './state';

Vue.use(Vuex);

// ???
const debug: boolean = true; //process.env.NODE_ENV !== 'production'

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

declare module 'vuex' {
    // declare augmentation for Vuex store for Pathify
    interface Store<S> {
        set: <T>(path: string, value?: any) => Promise<T> | undefined;
        get: <T>(path: string, ...args: any) => T | undefined;
        copy: <T>(path: string, ...args: any) => T | undefined;
    }
}
