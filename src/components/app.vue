<template>

    <section class="root">

        <word-list class="word-list"></word-list>

        <word-editor class="word-editor"></word-editor>

    </section>
</template>

<script lang='ts'>
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

/* import VuePerfectScrollbar from 'vue-perfect-scrollbar'; */

import wordList from './list/word-list.vue';
import wordEditor from './editor/word-editor.vue';

import { dFetchWods } from './../store/modules/words';

@Component({
    components: {
        // VuePerfectScrollbar,

        wordList,
        wordEditor
    }
})
export default class App extends Vue {
    /* settings = {
        maxScrollbarLength: 60
    }; */

    mounted() {
        dFetchWods(this.$store);
    }
}
</script>

<style lang="scss" scoped>
.root {
    padding: 8px 0;
    font-size: 16px;
    font-family: Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB,
        Microsoft YaHei, SimSun, sans-serif;

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