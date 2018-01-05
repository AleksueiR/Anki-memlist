<template>
    <div class="container">
        <!-- <el-row>
            <el-col> -->
                <section class="lookup">
                    <el-input
                        @keyup.enter.native="addOrEditWord()"
                        @keyup.esc.native="clearLookup"
                        @input="blah"
                        v-model.trim="lookup"
                        label="Lookup"
                        placeholder="type a word"
                        suffix-icon="el-icon-edit"
                        autofocus
                        :hint="lookupHint"
                        :clearable="true">
                    </el-input>
                </section>

                <word-menu></word-menu>
            <!-- </el-col> -->
            <!-- <el-col :span="2" class="word-menu">
                <word-menu></word-menu>
            </el-col> -->
        <!-- </el-row> -->
        <!-- <el-row> -->
            <span class="text-smaller">{{ lookupHint }}</span>
        <section class="scroll">
            <!-- <VuePerfectScrollbar class="scroll-area"> -->
                <ul class="list">
                    <word-item
                        v-for="word in items"
                        :key="word.text"
                        @archive="archiveWord"
                        @edit="editWord"
                        @select="selectWord"
                        v-on:remove="removeWord"
                        v-bind:word="word"></word-item>
                </ul>
        </section>
            <!-- </VuePerfectScrollbar> -->
        <!-- </el-row> -->
    </div>

</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import debounce from 'lodash/debounce';

import loglevel from 'loglevel';
loglevel.setDefaultLevel(loglevel.levels.TRACE);
const log: loglevel.Logger = loglevel.getLogger(`word-list`);

import anki from './../../api/anki';

import {
    Word,
    dSyncWords,
    rItems,
    cSelectWord,
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

    debounce = debounce;

    blah = this.debounce(this.foobar, 500);

    foobar(a: any): void {
        console.log('!!!', a, this.lookup);
        if (!this.isLookupValid) {
            log.info(`[word-list] not a word`);

            cSelectWord(this.$store, null);
            return;
        }

        const word = new Word({ text: this.lookup });

        cSelectWord(this.$store, word);
    }

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
        console.log('get items');

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
        //cSelectWord(word);
        //this.$router.push({ name: 'editor', params: { id: word.id } });
        //EventBus.$emit(WORD_SELECTED, word);
    }

    selectWord(word: Word): void {
        cSelectWord(this.$store, word);
    }

    removeWord(word: Word): void {
        cRemoveWord(this.$store, word);
        dSyncWords(this.$store);
    }
}
</script>

<style lang="scss" scoped>
.container {
    display: flex;
    flex-direction: column;
}

.lookup {
    height: 4em;
    flex-shrink: 0;
    display: flex;
    align-items: center;
}

.list {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.word-menu {
    text-align: right;
}

.scroll {
    overflow: auto;

    &::-webkit-scrollbar {
        width: 5px;
    }

    &::-webkit-scrollbar-thumb {
        background-color: rgba(#666, 0.05);
        transition: all 0.3s ease;
    }

    &:hover::-webkit-scrollbar-thumb {
        background-color: rgba(#666, 0.6);
    }
}
</style>


