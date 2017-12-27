<template>
    <div v-if="isExist">
        <h4>Verbal Advantage</h4>
        <div>
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
    @Prop() word: Word;

    get normalizedWord(): string {
        const letters = this.word.text.toLowerCase().split('');
        letters[0] = letters[0].toUpperCase();

        return letters.join('');
    }

    get isExist(): boolean {
        if (!vaWords[this.normalizedWord]) {
            return false;
        }

        return true;
    }

    get vaWord(): object {
        return vaWords[this.normalizedWord];
    }
}
</script>

<style lang="sass" scoped>

</style>


