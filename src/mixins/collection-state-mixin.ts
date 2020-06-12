import { Vue, Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
import {
    CollectionWord,
    CollectionIndex,
    CollectionList,
    CollectionListMap,
    LookupResult
} from '@/store/modules/collection';

const STORE_MODULE_NAME = 'collection';
const collection = namespace(STORE_MODULE_NAME);

/**
 * to use:
 * 'extends mixins(CollectionStateMixin)'
 * Then everything on this class will be available
 */
@Component
export default class CollectionStateMixin extends Vue {
    /* get $stash2() {
        return this.stash;
    } */

    // #region State

    @collection.State
    index: CollectionIndex;

    @collection.State
    lists: CollectionListMap;

    @collection.State
    selectedLists: CollectionList[];

    @collection.State
    selectedWords: CollectionWord[];

    @collection.State
    lookupValue: string;

    @collection.State
    lookupResults: LookupResult[];

    // #endregion State

    // #region Getter

    // #endregion Getter

    // #region Action

    @collection.Action
    moveWord: (payload: { wordId: string; listId: string }) => void;

    // #endregion Action
}
