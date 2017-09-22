import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';

import { words } from './modules/words';

import { State as RootState } from './state';

Vue.use(Vuex);

const debug: boolean = true; //process.env.NODE_ENV !== 'production'

export const createStore = () =>
    new Vuex.Store<RootState>({
        modules: {
            words
        }
    }
);