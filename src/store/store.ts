import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';

import { app } from './modules/app';
import { collection } from './modules/collection';
import { display } from './modules/display';

import { RootState } from './state';

Vue.use(Vuex);

// ???
const debug: boolean = true; //process.env.NODE_ENV !== 'production'

export const createStore = () =>
    new Vuex.Store<RootState>({
        modules: {
            app,
            collection,
            display
        }
    });
