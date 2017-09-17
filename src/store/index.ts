import Vue from 'vue';
import Vuex from 'vuex';
//import AsyncComputed from 'vue-async-computed';
// import * as actions from './actions';
// import * as getters from './getters';
// import cart from './modules/cart';
import words from './modules/words';
import createLogger from 'vuex/dist/logger';

//Vue.use(AsyncComputed);
Vue.use(Vuex);

const debug: boolean = true; //process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
    //actions,
    //getters,
    modules: {
        // cart,
        words
    },
    strict: debug,
    // plugins: debug ? [createLogger({})] : []
})