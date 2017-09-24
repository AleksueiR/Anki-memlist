<template>
    <v-app id="app">
        <main>
            <v-container fluid pa-0>
                <word-selector></word-selector>


                <router-link to="/long-list">Go to List</router-link>
                <router-link to="/word-editor/38">Go to editor</router-link>

                <div>
                    Hello, reloaded!!!- 1! -1-6-
                    <span>{{ msg }} {{ count }}</span>
                    <div>
                        <span class="test">green -</span>
                        <span class="test2">orange</span>
                    </div>

                </div>

                <router-view></router-view>

            </v-container>
        </main>
    </v-app>
</template>

<script lang='ts'>

import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import { dFetchWods } from './../store/modules/words';

@Component
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