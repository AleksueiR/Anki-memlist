import Vue from 'vue';

/* import VueRx from 'vue-rx';
import { Observable, Subscription, Subject } from 'rxjs'; */

import app from '@/app.vue';

import { Stash } from '@/stash';

/* Vue.use(VueRx, {
    Observable,
    Subscription,
    Subject
}); */

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

/* import amDrag from './am-drag.plugin';
Vue.use(amDrag); */

const stash = new Stash();

new Vue({
    el: '#app',
    stash,
    render: h => h(app)
});

// NOTE: expose stash on window for dev
(window as any).stash = stash;
