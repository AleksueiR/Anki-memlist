<template>

    <section class="root">
        <!-- {{ collectionIndex }} -->
        index {{ index.safeJSON }}
        <br>
        lists
        <div v-for="list in lists" :key="list.id"> {{ list.safeJSON }} </div>
        <!-- {{ getters.rIsSettingsOpen }} -->
        <!-- <word-list class="word-list"></word-list>

        <word-editor class="word-editor"></word-editor>

        <settings :isOpen.sync="isSettingsOpen"></settings>
        <bulk-import :isOpen.sync="isImportOpen"></bulk-import> -->

        <input v-model="blah" type="text" width="50">
        <button @click="qqq">asve</button>
    </section>

</template>

<script lang='ts'>
import { Vue, Component, Watch } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';

import wordList from './list/word-list.vue';
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
    CollectionIndex,
    CollectionList
} from '../store/modules/collection/index';

const CollectionState = namespace('collection', State);
const CollectionAction = namespace('collection', Action);

@Component({
    components: {
        wordList,
        wordEditor,

        settings,
        'bulk-import': bulkimport
    }
})
export default class App extends Vue {
    /* @ModuleGetter('items') wordItems: any[];
    @Mutation('selectWord') selectWord: (item: string | null) => void; */

    @CollectionState('index') index: CollectionIndex;
    @CollectionState('lists') lists: CollectionList[];

    @CollectionAction('fetchIndex') fetchIndex: () => void;
    @CollectionAction('addList') addList: (list: CollectionList) => void;

    blah: string = '';

    qqq(event: Event) {
        this.addList(new CollectionList({ name: this.blah }));
    }

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
        this.init();
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

    /* get collectionIndex() {
        return rCollectionIndex(this.$store);
    } */
}
</script>

<style lang="scss" src="../styles/common.scss">

</style>


<style lang="scss" scoped>
.root {
    padding: 8px 0;
    font-size: 16px;
    font-family: Segoe UI;

    display: flex;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    flex-direction: row;

    > section,
    > aside {
        display: flex;
    }
}

.word-list {
    width: 15em;
    flex-shrink: 0;
    margin-right: 16px;
}

.word-editor {
    margin-left: 16px;
    flex: 1;
}
</style>
