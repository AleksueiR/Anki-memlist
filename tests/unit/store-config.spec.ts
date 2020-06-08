/* import db from '@/store/modules/journals/db';
jest.mock('@/store/modules/journals/db');
 */

// jest.mock('@/store/modules/journals/db');

import { createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { createStore } from './store-config';

/* beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    (db as any).mockClear();
}); */

test('increments "count" value when "increment" is committed', async () => {
    //(db as any).mockImplementation(() => console.log('blah'));

    const localVue = createLocalVue();
    localVue.use(Vuex);
    // const store = new Vuex.Store(createStore());
    const store = createStore();

    await store.set('journals/fetch!');
    const journal = await store.get<any>('journals/active');

    expect(journal.rootGroupId).toBe(1);
    expect(store.state.journals.activeId).toBe(1);
});

/* test('updates "evenOrOdd" getter when "increment" is committed', () => {
    const localVue = createLocalVue();
    localVue.use(Vuex);
    const store = new Vuex.Store(createStore());
    expect(store.getters.evenOrOdd).toBe('even');
    store.commit('increment');
    expect(store.getters.evenOrOdd).toBe('odd');
}); */

/* import { shallowMount } from '@vue/test-utils';
import HelloWorld from '@/components/HelloWorld.vue';

describe('HelloWorld.vue', () => {
    it('renders props.msg when passed', () => {
        const msg = 'new message';
        const wrapper = shallowMount(HelloWorld, {
            propsData: { msg }
        });
        expect(wrapper.text()).toMatch(msg);
    });
});
 */
