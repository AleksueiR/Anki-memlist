import Vue from 'vue';
import Vuex from 'vuex';
import Vuetify from 'vuetify';
import VueRouter from 'vue-router';

import app from './components/app.vue';

// TODO: find how to split routes into separate files
import wordList from './components/list/word-list.vue';
import wordEditor from './components/word-editor.vue';


import { createStore } from "./store";
import { State } from './store/state';

Vue.use(Vuex);
Vue.use(Vuetify);
Vue.use(VueRouter);

const store: Vuex.Store<State> = createStore();

const routes = [
  { path: '/long-list', component: wordList, name: 'list' },
  { path: '/word-editor/:id', component: wordEditor, name: 'editor', props: true }
];

const router = new VueRouter({
  routes
});

// Vue.component('word-selector', wordSelector);

const rootVue = new Vue({
  el: '#app',
  store,
  router,
  template: '<app/>',
  components: { app }
});

router.replace({ name: 'list' });