<template>
   <div>
       word-editor word id {{ id }} {{ word }}

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
    @Prop()
    id: string

    get word(): Word | undefined {
        console.log('sdfsdfd');

        return rItems(this.$store).find(item => item.id === this.id);
    }
}
</script>

<style lang="scss" scoped>

</style>


