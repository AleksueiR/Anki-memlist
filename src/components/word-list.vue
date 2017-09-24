<template>
   <div>
        <ul>
            <li v-for="word in items" :key="word.text">
                {{ word.text }} - {{ word.archived }}
            </li>
        </ul>
   </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import storage from './../api/jsonbin';
import anki from './../api/anki';

import { Word, dFetchWods, dSyncWords, rItems } from './../store/modules/words';


@Component
export default class WordList extends Vue {

    // computed
    get items(): Word[] {
        return rItems(this.$store);
    }
}
</script>

<style lang="scss" scoped>

</style>


