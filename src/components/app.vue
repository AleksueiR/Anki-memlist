<template>
    <v-app id="app">
        <v-content>
            <v-container fluid pa-0>
                <v-layout column>
                    <router-view></router-view>
                </v-layout>
            </v-container>
        </v-content>
    </v-app>
</template>

<script lang='ts'>

import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import wordList from './list/word-list.vue';
import wordEditor from './word-editor.vue';

import { dFetchWods } from './../store/modules/words';

@Component({
    components: {
        wordList,
        wordEditor
    }
})
export default class App extends Vue {
    count = 0;

    cache: any = {};

    mounted() {
        dFetchWods(this.$store);

        const handle = setInterval(() =>
            (this.count += 3),
            1000);

        console.log('helo');
    }
};
</script>

<style lang="scss" scoped>
@import url('./../../node_modules/vuetify/dist/vuetify.min.css');

#app {
    // font-family: 'Avenir', Helvetica, Arial, sans-serif;
    // text-align: center;
    // color: #2c3e50;
    span {
        // color: red;
    }
    div .test {
        color: green;
    }
    .test2 {
        color: orange;
    }
}
</style>