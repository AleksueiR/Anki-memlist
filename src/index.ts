import Vue from 'vue';
import app from './components/app.vue';
import store from './store';

//import * as Highcharts from 'highcharts';

new Vue({
  el: '#app',
  store,
  template: '<app/>',
  components: { app }
});

// console.log('main', Highcharts);

export {
    //Highcharts
}