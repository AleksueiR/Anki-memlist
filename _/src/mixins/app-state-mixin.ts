import { Vue, Component, Emit } from 'vue-property-decorator';

import { State, Getter, Action, Mutation, namespace } from 'vuex-class';

const STORE = 'app';

const StateAP = namespace(STORE, State);
const GetterAP = namespace(STORE, Getter);
const ActionAP = namespace(STORE, Action);

/**
 * to use:
 * 'extends mixins(AppStateMixin)'
 * Then everything on this class will be available
 */
@Component
export default class AppStateMixin extends Vue {
    @StateAP isCollectionViewOpen: boolean;

    @ActionAP openCollectionView: (value: { value: boolean }) => {};
}
