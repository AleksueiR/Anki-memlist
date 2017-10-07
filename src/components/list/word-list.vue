<template>
   <div>
        <v-list dense>
            <template v-for="word in items">
                <word-item
                    :key="word.text"
                    @archive="archiveWord"
                    @edit="editWord"
                    v-on:remove="removeWord"
                    v-bind:word="word"></word-item>
            </template>
        </v-list>
   </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import anki from './../../api/anki';

import { Word, dSyncWords, rItems, cRemoveWord } from './../../store/modules/words';
import wordItem from './word-item.vue';

@Component({
    components: {
        wordItem
    }
})
export default class WordList extends Vue {

    // computed
    get items(): Word[] {
        return rItems(this.$store);
    }

    archiveWord(word: Word): void {
        word.archived = true;
        dSyncWords(this.$store);
    }

    editWord(word: Word): void {
        this.$router.push({ name: 'editor', params: { id: word.id } });
    }

    removeWord(word: Word): void {
        cRemoveWord(this.$store, word);
        dSyncWords(this.$store);
    }
}
</script>

<style lang="scss" scoped>

</style>


