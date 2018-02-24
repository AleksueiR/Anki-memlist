<template>

    <section class="root uk-flex">

        <collection-view></collection-view>

        <list-view></list-view>

        <word-editor class="word-editor"></word-editor>

        <!-- <settings :isOpen.sync="isSettingsOpen"></settings>
        <bulk-import :isOpen.sync="isImportOpen"></bulk-import> -->

    </section>

</template>

<script lang='ts'>
import { Vue, Component, Watch } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';

import collectionView from './collection/collection-view.vue';
import listView from './list/list-view.vue';
import wordEditor from './editor/word-editor.vue';
import settings from './dialogs/settings.vue';
import bulkimport from './dialogs/bulk-import.vue';

import {
    rIsImportOpen,
    rIsSettingsOpen,
    cOpenSettings
} from './../store/modules/app';

import { dFetchWods } from './../store/modules/words';

// import { dInitCollection } from './../store/modules/collection';

import { areSettingsValid } from './../settings';
import {
    CollectionState,
    CollectionIndex,
    CollectionList,
    CollectionTree
} from '../store/modules/collection/index';

const StateCL = namespace('collection', State);
const ActionCL = namespace('collection', Action);

@Component({
    components: {
        collectionView,
        listView,
        wordEditor,

        settings,
        'bulk-import': bulkimport
    }
})
export default class App extends Vue {
    /* @ModuleGetter('items') wordItems: any[];
    @Mutation('selectWord') selectWord: (item: string | null) => void; */

    @StateCL('index') index: CollectionIndex;
    @StateCL('lists') lists: Map<string, CollectionList>;

    /* @StateCL((state: CollectionState) =>
        Array.from(state.lists.values())
    )
    lists: CollectionList[]; */

    @StateCL('selectedLists') selectedLists: CollectionList[];

    @ActionCL('fetchIndex') fetchIndex: () => void;
    @ActionCL('addList') addList: (list: CollectionList) => void;
    @ActionCL('selectList') selectList: (options: { listId: string }) => void;

    @Watch('isSettingsOpen')
    onIsSettingsOpenChange(value: boolean): void {
        console.log('!!!!');
        if (!value) {
            this.init();
        }
    }

    get isImportOpen(): boolean {
        return rIsImportOpen(this.$store);
    }

    get isSettingsOpen(): boolean {
        return rIsSettingsOpen(this.$store);
    }

    mounted(): void {
        // TODO: when should setting check happen
        // this.init();

        console.log('fetch index');
        this.fetchIndex();
    }

    init(): void {
        if (areSettingsValid()) {
            console.log('sdfsd');
            // dInitCollection(this.$store); //!!
            dFetchWods(this.$store);
        } else {
            cOpenSettings(this.$store, true);
        }
    }
}
</script>

<style lang="scss">
@import './../styles/common.scss';
@import './../../node_modules/uikit/dist/css/uikit.min.css';
</style>


<style lang="scss" scoped>
.root {
    // padding: 8px 0;

    font-size: 16px;
    font-family: Segoe UI;

    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
}

/* .word-list {
    width: 15em;
    flex-shrink: 0;
    margin-right: 16px;
} */

/* .word-editor {
    margin-left: 16px;
    flex: 1;
} */
</style>
