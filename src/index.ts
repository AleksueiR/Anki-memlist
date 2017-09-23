import Vue from 'vue';
import Vuex from 'vuex';
import Vuetify from 'vuetify';

import app from './components/app.vue';
import { createStore } from "./store";

import { State } from './store/state';

Vue.use(Vuetify);
Vue.use(Vuex);

const astore: Vuex.Store<State> = createStore();

new Vue({
  el: '#app',
  store: astore,
  template: '<app/>',
  components: { app }
});

// console.log('main', Highcharts);

export {
    //Highcharts
}


import axios from 'axios';

const url = 'https://www.vocabulary.com/dictionary/definition.ajax?search=supine&lang=en';
axios.get(url).then(response =>
  console.log(response.data));
