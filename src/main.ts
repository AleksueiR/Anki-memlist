import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import VueRx from 'vue-rx';
import { Observable, Subscription, Subject } from 'rxjs';
import Vuebar from 'vuebar';

import app from './components/app.vue';

import { createStore } from './store';
import { RootState } from './store/state';

Vue.use(Vuex);
Vue.use(VueRx, {
    Observable,
    Subscription,
    Subject
});

Vue.use(Vuebar);

const store: Store<RootState> = createStore();

import OctoIconV from '@/components/bits/octo-icon.vue';
Vue.component('octo-icon', OctoIconV);

Vue.config.productionTip = false;
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

import amDrag from './am-drag.plugin';
Vue.use(amDrag);

// augment Vue type with vuebar functions
declare module 'vue/types/vue' {
    interface Vue {
        $vuebar: {
            refreshScrollbar: (elemeht: HTMLElement) => void;
        };
    }
}

new Vue({
    el: '#app',
    store,
    render: h => h(app)
});
