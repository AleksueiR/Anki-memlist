<template>
    <div>
        <h4>Verbal Advantage</h4>
        <div v-if="isExist">
            <p>{{ vaWord.pronunciation }}</p>

            <p v-html="vaWord.description"></p>
        </div>
    </div>
</template>

<script lang="ts">
const vaWords = require('./../../assets/full-list.json');

import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import { Word } from './../store/modules/words';

@Component
export default class VASource extends Vue {
    @Prop()
    word: Word;

    get isExist(): boolean {
        if (!vaWords[this.word.text]) {
            return false;
        }

        return true;
    }

    get vaWord(): object {
        return vaWords[this.word.text];
    }
}

</script>

<style lang="sass" scoped>

</style>


