<template>
    <v-layout column>
        <v-layout row>
            <v-flex md4 offset-md4>
                <v-text-field
                    @keyup.13="addNewWord()"
                    ref="lookupValue"
                    label="word lookup"
                    v-model.trim="lookupValue"
                    single-line autofocus></v-text-field>
            </v-flex>

            {{ lookupValue }}
        </v-layout>
        <v-layout row>
            <v-flex md4 offset-md4>
                <span v-if="isNewWord">Nothing found. Press 'Enter' to add to the list.</span>
                <ul>
                    <li v-for="word in lookupResults" :key="word.text">
                        {{ word.text }} - {{ word.archived }}
                    </li>
                </ul>
            </v-flex>
        </v-layout>
    </v-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import storage from './../api/jsonbin';
import anki from './../api/anki';

import { Word, dSyncWords, rItems, cAddWord } from './../store/modules/words';


@Component
export default class WordSelector extends Vue {
    lookupValue: string = '';

    // computed
    get lookupResults(): Word[] {
        if (this.lookupValue === '') {
            return [];
        }

        return rItems(this.$store)
            .filter((word: Word) => word.text.toLowerCase().startsWith(this.lookupValue));
    }

    get isLookup() {
        return this.lookupValue !== '';
    }

    /**
     * Checks if the lookup is a new word - it's not new if it has an exact duplicate.
     */
    get isNewWord() {
        if (this.lookupValue === '') {
            return false;
        }

        const a = rItems(this.$store)
            .find((word: Word) => word.text === this.lookupValue) as Word;


        return rItems(this.$store)
            .find((word: Word) => word.text === this.lookupValue)
            === undefined;
    }

    // methods
    addNewWord(event:any) {
        console.log(event);
        cAddWord(this.$store, new Word(this.lookupValue));
        dSyncWords(this.$store);

        this.lookupValue = '';
        // console.log(this.$refs.lookupValue.value = '');
    }
}

function isWord(word: Word | undefined): word is Word {
    return (<Word>word) !== undefined;
}
</script>

<style lang="scss" scoped>

</style>


