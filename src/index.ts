import devtools from '@vue/devtools';

if (process.env.NODE_ENV === 'development') {
    devtools.connect(/* host */);
}

import Vue from 'vue';
import Vuex, { Store } from 'vuex';
// import VueRouter from 'vue-router';
import ElementUI from 'element-ui';
// import 'element-ui/lib/theme-default/index.css'
import 'element-ui/lib/theme-chalk/index.css';

import app from './components/app.vue';

import routes from './routes';

import { createStore } from './store';
import { State } from './store/state';

Vue.use(Vuex);
Vue.use(ElementUI);
//Vue.use(VueRouter);

const store: Store<State> = createStore();
// const router = new VueRouter({ routes });

import fontawesome from '@fortawesome/fontawesome';
import { faAngleUp, faAngleDown } from '@fortawesome/fontawesome-free-solid';

fontawesome.library.add(faAngleUp, faAngleDown);

const rootVue = new Vue({
    el: '#app',
    store,
    // router,
    template: '<app/>',
    components: { app }
});

// router.replace({ name: 'list' });
