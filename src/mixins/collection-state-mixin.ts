import { Vue, Component, Emit } from 'vue-property-decorator';

import { State, Getter, Action, Mutation, namespace } from 'vuex-class';

import { CollectionWord } from '@/store/modules/collection';

const STORE = 'collection';

const StateCL = namespace(STORE, State);
const GetterCL = namespace(STORE, Getter);
const ActionCL = namespace(STORE, Action);

/**
 * to use:
 * 'extends mixins(CollectionStateMixin)'
 * Then everything on this class will be available
 */
@Component
export default class CollectionStateMixin extends Vue {
    @StateCL lookupValue: string;

    @StateCL selectedWords: CollectionWord[];

    @ActionCL moveWord: (payload: { wordId: string; listId: string }) => void;
}
