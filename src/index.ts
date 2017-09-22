import Vue from 'vue';
import Vuex from 'vuex';

import app from './components/app.vue';
import { createStore } from "./store";

import { State } from './store/state';
//import * as Highcharts from 'highcharts';

// const k:app = new app();

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