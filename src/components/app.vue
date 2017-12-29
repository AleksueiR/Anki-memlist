<template>

    <div class="root">
        <!-- <VuePerfectScrollbar class="scroll-area" v-once :settings="settings"> -->
        <router-view></router-view>
        <!-- </VuePerfectScrollbar> -->
    </div>

    <!-- <v-app id="app">
        <v-content>
            <v-container fluid pa-0>
                <v-layout column>

                </v-layout>
            </v-container>
        </v-content>
    </v-app> -->
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
    settings = {
        maxScrollbarLength: 60
    };

    mounted() {
        dFetchWods(this.$store);
    }
}
</script>

<style lang="scss" scoped>
@import url('~element-ui/lib/theme-chalk/index.css');

.root {
    padding: 16px;
    font-family: Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB,
        Microsoft YaHei, SimSun, sans-serif;
}

.scroll-area {
    position: relative;
    margin: auto;
    // width: 400px;
    // height: 300px;
}
</style>