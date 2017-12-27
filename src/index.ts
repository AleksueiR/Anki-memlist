import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import VueRouter from 'vue-router';
import ElementUI from 'element-ui';
// import 'element-ui/lib/theme-default/index.css'

import app from './components/app.vue';

import routes from './routes';

import { createStore } from './store';
import { State } from './store/state';

Vue.use(Vuex);
Vue.use(ElementUI);
Vue.use(VueRouter);

const store: Store<State> = createStore();
const router = new VueRouter({ routes });

const rootVue = new Vue({
    el: '#app',
    store,
    router,
    template: '<app/>',
    components: { app }
});

router.replace({ name: 'list' });
