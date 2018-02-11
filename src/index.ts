import devtools from '@vue/devtools';

if (process.env.NODE_ENV === 'development') {
    // devtools.connect(/* host */);
}

import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import ElementUI from 'element-ui';
// import 'element-ui/lib/theme-default/index.css'
import 'element-ui/lib/theme-chalk/index.css';

import app from './components/app.vue';

import { createStore } from './store';
import { State } from './store/state';

Vue.use(Vuex);
Vue.use(ElementUI);

const store: Store<State> = createStore();

import fontawesome from '@fortawesome/fontawesome';

import faAngleUp from '@fortawesome/fontawesome-free-solid/faAngleUp';
import faAngleDown from '@fortawesome/fontawesome-free-solid/faAngleDown';
import file from '@fortawesome/fontawesome-free-solid/faFile';
import bookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import faPlus from '@fortawesome/fontawesome-free-solid/faPlus';

fontawesome.library.add(faAngleUp, faAngleDown, file, bookmark, faPlus);

Vue.config.keyCodes = {
    up: 38,
    down: 40,
    left: 37,
    right: 39,
    f2: 113,
    enter: 13,
    ctrl: 17
};

const rootVue = new Vue({
    el: '#app',
    store,
    template: '<app/>',
    components: { app }
});

// router.replace({ name: 'list' });

// dev tools: ./node_modules/.bin/vue-devtools
