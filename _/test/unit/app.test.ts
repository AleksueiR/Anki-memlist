import Vue from 'vue';
import app from '../../src/components/app.vue';
import assert from 'assert';

it('ok', () => {
    const vm = new app().$mount();
    assert(vm.msg === 'Hello world!!');

    //console.log('--', vm.msg, vm.$el.textContent);
});