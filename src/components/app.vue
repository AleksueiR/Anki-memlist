<template>
    <div class="root">
        <router-view></router-view>
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

import wordList from './list/word-list.vue';
import wordEditor from './editor/word-editor.vue';

import { dFetchWods } from './../store/modules/words';

@Component({
    components: {
        wordList,
        wordEditor
    }
})
export default class App extends Vue {
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
</style>