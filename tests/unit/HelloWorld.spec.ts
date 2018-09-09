import { shallowMount } from '@vue/test-utils';
// import HelloWorld from '@/components/HelloWorld.vue';

import jsonStorage from 'electron-json-storage';

import { collection } from '@/store/modules/collection/collection';
import storage from '@/api/storage';

/* describe('HelloWorld.vue', () => {
    it('renders props.msg when passed', () => {
        const msg = 'new message';
        const wrapper = shallowMount(HelloWorld, {
            propsData: { msg }
        });
        expect(wrapper.text()).toMatch(msg);
    });
});
 */

jest.mock('@/api/storage');

// let storage: jest.Mocked<Storage>;
/* jest.mock('electron-json-storage');
jest.mock('@/api/storage'); */

describe('HelloWorld.vue', () => {
    it('renders props.msg when passed', () => {
        /* (storage.hasCollection as any).get.mockResolvedValue(Promise.resolve(false)); */

        console.log(storage.hasCollection());

        collection.actions.fetchIndex({} as any);

        /* const msg = 'new message';
        const wrapper = shallowMount(HelloWorld, {
            propsData: { msg }
        });
        expect(wrapper.text()).toMatch(msg); */
    });
});
