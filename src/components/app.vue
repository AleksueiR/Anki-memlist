<template>
    <section class="root uk-flex">
        <collection-toolbar></collection-toolbar>

        <span class="divider-right"></span>

        <!-- hide/show `collection-view` and its separator -->
        <!-- cannot use v-show in `template` as it rendered only once -->
        <collection-view v-show="isCollectionViewOpen"></collection-view>

        <span v-show="isCollectionViewOpen" class="divider"></span>

        <pool-view></pool-view>

        <span class="divider"></span>

        <word-editor class="word-editor"></word-editor>

        <!--
            <settings :isOpen.sync="isSettingsOpen"></settings>
            <bulk-import :isOpen.sync="isImportOpen"></bulk-import>
        -->
    </section>
</template>

<script lang="ts">
import { Vue, Component, Watch } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';
import { mixins } from 'vue-class-component';

import collectionToolbarV from '@/components/collection/collection-toolbar.vue';
import collectionView from './collection/collection-view.vue';
import poolViewV from './pool/pool-view.vue';
import wordEditor from './editor/word-editor.vue';
// import settings from './dialogs/settings.vue';
// import bulkimport from './dialogs/bulk-import.vue';

import AppStateMixin from '@/mixins/app-state-mixin';

// import { rIsImportOpen, rIsSettingsOpen, cOpenSettings } from './../store/modules/app';

// import { dFetchWods } from './../store/modules/words';

// import { dInitCollection } from './../store/modules/collection';

// import { areSettingsValid } from './../settings';

import {
    CollectionState,
    CollectionIndex,
    CollectionList,
    CollectionListMap,
    CollectionTree
} from '../store/modules/collection/index';
import { books, Wordbook } from '@/api/wordbook';

const StateCL = namespace('collection', State);
const ActionCL = namespace('collection', Action);

const display = namespace('display');

@Component({
    components: {
        'collection-toolbar': collectionToolbarV,
        collectionView,
        'pool-view': poolViewV,
        wordEditor

        // settings,
        // 'bulk-import': bulkimport
    }
})
export default class App extends mixins(AppStateMixin) {
    /* @ModuleGetter('items') wordItems: any[];
    @Mutation('selectWord') selectWord: (item: string | null) => void; */

    @StateCL('index')
    index: CollectionIndex;
    @StateCL('lists')
    lists: CollectionListMap;

    /* @StateCL((state: CollectionState) =>
        Array.from(state.lists.values())
    )
    lists: CollectionList[]; */

    @StateCL('selectedLists')
    selectedLists: CollectionList[];

    @ActionCL('fetchIndex')
    fetchIndex: () => void;
    @ActionCL('addList')
    addList: (list: CollectionList) => void;
    @ActionCL('selectList')
    selectList: (options: { listId: string }) => void;

    @Watch('isSettingsOpen')
    onIsSettingsOpenChange(value: boolean): void {
        console.log('!!!!');
        if (!value) {
            this.init();
        }
    }

    /* get isImportOpen(): boolean {
        return rIsImportOpen(this.$store);
    }

    get isSettingsOpen(): boolean {
        return rIsSettingsOpen(this.$store);
    } */

    @display.Action setWordbooks: (payload: { value: Wordbook[] }) => void;

    mounted(): void {
        // TODO: when should setting check happen
        // this.init();

        console.log('fetch index');
        this.fetchIndex();

        this.setWordbooks({ value: books });
    }

    init(): void {
        /* if (areSettingsValid()) {
            console.log('sdfsd');
            // dInitCollection(this.$store); //!!
            dFetchWods(this.$store);
        } else {
            cOpenSettings(this.$store, true);
        } */
    }
}
</script>

<style lang="scss">
@import './../styles/common';
@import './../../node_modules/uikit/dist/css/uikit.min.css';
</style>

<style lang="scss" scoped>
.root {
    padding: 0;

    font-size: 16px;
    font-family: Segoe UI;

    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
}

// TODO: move to global classes?
span[class^='divider'] {
    background-color: rgba(0, 0, 0, 0.24);

    width: 1px;
    margin: 0; // 0.5rem; // 1rem 0.5rem;

    flex-shrink: 0;

    /* &[class$='-left'] {
        margin-right: 0;
    }

    &[class$='-right'] {
        margin-left: 0;
    } */
}
</style>
