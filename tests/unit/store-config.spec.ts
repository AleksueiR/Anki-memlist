import { db } from '@/api/db';
import { Stash } from '@/stash';
import { rePopulate } from './dummy-data';

beforeEach(() => {
    return rePopulate(db);
});

test('', async () => {
    const { journals, groups } = new Stash();

    await journals.fetch();
    expect(journals.activeId).toBe(1);

    const journal = journals.active!;

    expect(journal.rootGroupId).toBe(1);
    expect(journal.defaultGroupId).toBe(null);

    await journals.setDefaultGroupId(2);
    expect(journal.defaultGroupId).toBe(2);

    // create a new journal
    const newJournalId = await journals.new('new journal');
    expect(newJournalId).toBe(2);
    expect(Object.entries(journals.all).length).toBe(2);

    // check journal values
    const newJournal = journals.get(newJournalId)!;
    expect(newJournal.id).toBe(2);
    expect(newJournal.defaultGroupId).toBe(null);
    expect(newJournal.rootGroupId).toBe(7);
    expect(newJournal.name).toBe('new journal');

    // set it to active
    await journals.setActiveId(newJournalId);
    expect(journals.active).toBe(newJournal);
});

test('increments "count" value when "increment" is committed', async () => {
    const { journals } = new Stash();

    await journals.fetch();

    const journal = journals.active!;

    expect(journal.rootGroupId).toBe(1);
    expect(journals.activeId).toBe(1);

    const newJournalId = await journals.new('test');

    const newJournal = await db.journals.get(newJournalId);

    expect(newJournal).not.toBeUndefined();
    expect(newJournal!.name).toBe('test');
    expect(newJournal!.id).toBe(newJournalId);

    expect(newJournal).toEqual(journals.all[newJournalId]);

    journals.reset();

    expect(Object.entries(journals.all).length).toBe(0);
});

/* test('increments "count" value when "increment" is committed', async () => {
    //(db as any).mockImplementation(() => console.log('blah'));

    const localVue = createLocalVue();
    localVue.use(Vuex);
    // const store = new Vuex.Store(createStore());
    const store = createStore();

    await store.set('journals/fetch!');
    const journal = await store.get<any>('journals/active');

    expect(journal.rootGroupId).toBe(1);
    expect(store.state.journals.activeId).toBe(1);
}); */

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
