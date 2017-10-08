<template>
    <v-layout column>
        <v-layout row>
            <v-flex md4 offset-md4>
                <v-text-field
                    @focus="isFocused = true"
                    @keyup.13="addOrEdit()"
                    label="word lookup"
                    :hint="hint"
                    v-model.trim="lookupValue"
                    single-line
                    clearable
                    autofocus></v-text-field>
            </v-flex>
        </v-layout>
        <v-layout row v-if="isNonEmptyLookup && isFocused">
            <v-flex md4 offset-md4>
                <v-list dense>
                    <template v-for="word in lookupResults" >
                        <v-list-tile @click="editWord(word)" :key="word.text">

                            <v-list-tile-content>
                                <v-list-tile-title>{{ word.text }} </v-list-tile-title>
                            </v-list-tile-content>

                            <!--v-list-tile-action>
                                <v-btn icon small class="ma-0"
                                    @click.stop.prevent="archive">
                                    <v-icon>mdi-archive</v-icon>
                                </v-btn>
                            </v-list-tile-action>

                            <v-list-tile-action>
                                <v-btn icon small class="ma-0"
                                    @click.stop.prevent="remove">
                                    <v-icon>mdi-delete</v-icon>
                                </v-btn>
                            </v-list-tile-action-->
                        </v-list-tile>
                    </template>
                </v-list>
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
    isFocused: boolean = false;

    lookupValue: string = '';

    get isNonEmptyLookup() {
        return this.lookupValue !== '' && this.lookupValue !== null;
    }

    // computed
    get lookupResults(): Word[] {
        if (!this.isNonEmptyLookup) {
            return [];
        }

        const results = rItems(this.$store)
            .filter((word: Word) => {console.log(word);
                return word.text.toLowerCase().startsWith(this.lookupValue.toLowerCase())})
            .slice(0, 9)

        return results;
    }

    get hint(): string {
        if (!this.isNonEmptyLookup) {
            return '';
        }

        return this.isNewWord ?
            `Nothing found. Press 'Enter' to add to the list.` :
            `Already exists. Press 'Enter' to edit.`;
    }

    /**
     * Checks if the lookup is a new word - it's not new if it has an exact duplicate.
     */
    get isNewWord() {
        if (this.lookupValue === '') {
            return false;
        }

        const isNew = !this.lookupResults.some(result => result.text === this.lookupValue);

        return isNew;
    }

    addOrEdit(event: any): void {
        if (this.isNewWord) {
            this.addNewWord(event);
        } else {
            const word = this.lookupResults.find(result => result.text === this.lookupValue);
            this.editWord(word!);
        }
    }

    // methods
    addNewWord(event: any): void {

        cAddWord(this.$store, new Word({ text: this.lookupValue }));
        dSyncWords(this.$store);

        this.lookupValue = '';
    }

    editWord(word: Word): void {
        console.log('edit workd');
        this.$router.push({ name: 'editor', params: { id: word.id } });

        this.lookupValue = '';
    }
}

</script>

<style lang="scss" scoped>

</style>


