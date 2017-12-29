<template>
    <div>
        <el-row :gutter="20">
            <el-col :span="22">
                <el-input
                    @keyup.enter.native="addOrEditWord()"
                    @keyup.esc.native="clearLookup"
                    label="Lookup"
                    :hint="lookupHint"
                    v-model.trim="lookup"
                    autofocus
                    suffix-icon="el-icon-edit"
                    :clearable="true">
                </el-input>
                <span class="text-smaller">{{ lookupHint }}</span>
            </el-col>
            <el-col :span="2" class="word-menu">
                <word-menu></word-menu>
            </el-col>
        </el-row>
        <el-row>
            <ul class="word-list">
                <word-item
                    v-for="word in items"
                    :key="word.text"
                    @archive="archiveWord"
                    @edit="editWord"
                    v-on:remove="removeWord"
                    v-bind:word="word"></word-item>
            </ul>
        </el-row>
    </div>

</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import anki from './../../api/anki';

import {
    Word,
    dSyncWords,
    rItems,
    cRemoveWord,
    cAddWord
} from './../../store/modules/words';
import wordItem from './word-item.vue';
import wordMenu from './word-menu.vue';

@Component({
    components: {
        wordItem,
        wordMenu
    }
})
export default class WordList extends Vue {
    lookup: string = '';

    get isLookupValid(): boolean {
        return this.lookup !== '' && this.lookup !== null;
    }

    get lookupHint(): string {
        if (!this.isLookupValid) {
            return '';
        }

        return this.isLookupNew
            ? `Nothing found. Press 'Enter' to add to the list.`
            : `Already exists. Press 'Enter' to edit.`;
    }

    /**
     * Checks if the lookup is a new word - it's not new if it has an exact duplicate.
     */
    get isLookupNew() {
        if (!this.isLookupValid) {
            return false;
        }

        const isNew = !this.items.some(result => result.text === this.lookup);

        return isNew;
    }

    get items(): Word[] {
        const filteredItems = rItems(this.$store)
            .filter((word: Word) => {
                if (!this.isLookupValid) {
                    return word;
                }

                return word.text
                    .toLowerCase()
                    .startsWith(this.lookup.toLowerCase());
            })
            .sort((wordA: Word, wordB: Word) => {
                if (wordA.dateAdded > wordB.dateAdded) {
                    return -1;
                }
                if (wordA.dateAdded < wordB.dateAdded) {
                    return 1;
                }
                if (wordA.text > wordB.text) {
                    return 1;
                }
                if (wordA.text < wordB.text) {
                    return -1;
                }
                return 0;
            });
        /* .sort((wordA: Word, wordB: Word) => {
                if (wordA.text > wordB.text) { return 1; }
                if (wordA.text < wordB.text) { return -1; }
                return 0;
            }); */

        return filteredItems;
    }

    addOrEditWord(): void {
        if (this.isLookupNew) {
            this.addNewWord();
        } else {
            this.editWord(this.items[0]);
        }
    }

    clearLookup(): void {
        this.lookup = '';
    }

    addNewWord(): void {
        cAddWord(this.$store, new Word({ text: this.lookup }));
        dSyncWords(this.$store);

        this.lookup = '';
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
.word-list {
    list-style-type: none;
    padding: 0;
}

.word-menu {
    text-align: right;
}
</style>


