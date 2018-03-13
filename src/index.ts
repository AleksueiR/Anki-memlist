import devtools from '@vue/devtools';

if (process.env.NODE_ENV === 'development') {
    // TODO: uncomment to debug
    // run: ./node_modules/.bin/vue-devtools
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

import OctoIconV from './components/bits/octo-icon.vue';
Vue.component('octo-icon', OctoIconV);

import fontawesome from '@fortawesome/fontawesome';

import farAngleUp from '@fortawesome/fontawesome-free-solid/farAngleUp';
import farAngleDown from '@fortawesome/fontawesome-free-solid/farAngleDown';
import farBookmark from '@fortawesome/fontawesome-free-regular/faBookmark';
//import farThumbtack from '@fortawesome/fontawesome-free-regular/faThumbtack';
import faAngleUp from '@fortawesome/fontawesome-free-solid/faAngleUp';
import faAngleDown from '@fortawesome/fontawesome-free-solid/faAngleDown';
import file from '@fortawesome/fontawesome-free-solid/faFile';
import faBookmark from '@fortawesome/fontawesome-free-solid/faBookmark';
import faPlus from '@fortawesome/fontawesome-free-solid/faPlus';
import faThumbtack from '@fortawesome/fontawesome-free-solid/faThumbtack';

import 'mdi-vue/CommentAlertIcon';
import 'mdi-vue/PinIcon';

fontawesome.library.add(
    farBookmark,
    //farThumbtack,
    faAngleUp,
    faAngleDown,
    file,
    faBookmark,
    faPlus,
    faThumbtack
);

import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';

UIkit.use(Icons);

Vue.config.keyCodes = {
    up: 38,
    down: 40,
    left: 37,
    right: 39,
    f2: 113,
    enter: 13,
    esc: 27,
    ctrl: 17
};

const rootVue = new Vue({
    el: '#app',
    store,
    template: '<app/>',
    components: {
        app
    }
});

// UIkit.notification("<span uk-icon='icon: check'></span> Message", { timeout: 55555555 });

// dev tools: ./node_modules/.bin/vue-devtools
