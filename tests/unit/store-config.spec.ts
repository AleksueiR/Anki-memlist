import { db, Group } from '@/api/db';
import { Stash } from '@/stash';
import { rePopulate } from './dummy-data';

beforeEach(() => {
    return rePopulate(db);
});

test('creates journals', async () => {
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

test('moves groups', async () => {
    const { journals, groups } = new Stash();

    await journals.fetch();

    const rootGroup = groups.get(1)!;

    // check default subgroups
    expect(rootGroup.subGroupIds).toEqual([2, 3, 4, 5, 6]);
    expect(groups.get(2)?.subGroupIds).toEqual([]);

    // move things around
    await groups.move(6, 2);

    expect(groups.get(2)?.subGroupIds).toEqual([6]);
    expect(rootGroup.subGroupIds).toEqual([2, 3, 4, 5]);

    // create a new group
    const newGroupId = await groups.new('new group');
    expect(newGroupId).toBe(7);

    expect(rootGroup.subGroupIds).toEqual([2, 3, 4, 5, 7]);

    // move it
    await groups.move(7, 6);

    expect(rootGroup.subGroupIds).toEqual([2, 3, 4, 5]);
    expect(groups.get(2)?.subGroupIds).toEqual([6]);
    expect(groups.get(6)?.subGroupIds).toEqual([7]);

    // move everything to 2
    await groups.move(5, 2);
    await groups.move(4, 2);
    await groups.move(3, 2);
    await groups.move(7, 2);

    // try silly things
    await groups.move(2, 2);

    expect(rootGroup.subGroupIds).toEqual([2]);
    expect(groups.get(2)?.subGroupIds.sort()).toEqual([3, 4, 5, 6, 7]);
    expect(groups.get(6)?.subGroupIds).toEqual([]);

    // try moving the root group
    await groups.move(1, 2);
    expect(groups.get(2)?.subGroupIds.sort()).toEqual([3, 4, 5, 6, 7]);

    const err = await groups.detach(1);
    expect(err).toBe(0);

    const err2 = await groups.attach(1, 2);
    expect(err).toBe(0);
    expect(groups.get(2)?.subGroupIds.sort()).toEqual([3, 4, 5, 6, 7]);

    const err3 = await groups.attach(2, 3);
    expect(err).toBe(0);
    expect(groups.get(3)?.subGroupIds.sort()).toEqual([]);
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
