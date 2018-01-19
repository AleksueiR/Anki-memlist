<template>

    <section class="root">

        <word-list class="word-list"></word-list>

        <word-editor class="word-editor"></word-editor>

        <settings :isOpen.sync="isSettingsOpen"></settings>
        <bulk-import :isOpen.sync="isImportOpen"></bulk-import>
    </section>

</template>

<script lang='ts'>
import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';

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

import { areSettingsValid } from './../settings';

@Component({
    components: {
        wordList,
        wordEditor,

        settings,
        'bulk-import': bulkimport
    }
})
export default class App extends Vue {
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
    }

    init(): void {
        if (areSettingsValid()) {
            console.log('sdfsd');
            dFetchWods(this.$store);
        } else {
            cOpenSettings(this.$store, true);
        }
    }
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
