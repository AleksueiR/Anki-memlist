<template>

    <section class="list-view">

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

        <span class="text-smaller">{{ lookupHint }}</span>

        <section class="cm-scrollbar">
            <ul class="list">
                <list-item
                    v-for="word in getPooledWords"
                    :key="word.id"
                    @archive="archiveWord"
                    @edit="editWord"
                    v-on:remove="removeWord"
                    :word="word"></list-item>
            </ul>
        </section>

        <span>{{ getPooledWords.length }} words</span> <span v-if="selectedLists.length > 1">{{ selectedLists.length }} lists</span>


        <!-- <div v-for="word in getPooledWords" :key="word.id">{{ word.text }}</div> -->

        <div class="container" v-if="false">
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


                <!-- </el-col> -->
                <!-- <el-col :span="2" class="word-menu">
                    <word-menu></word-menu>
                </el-col> -->
            <!-- </el-row> -->
            <!-- <el-row> -->
                <span class="text-smaller">{{ lookupHint }}</span>
            <section class="cm-scrollbar">
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
            <!-- </el-row> -->
        </div>

    </section>

</template>

<script lang="ts">
// TODO: use virual scroller for the list view: https://github.com/Akryum/vue-virtual-scroller#variable-height-mode

import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';

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

import listItem from './list-item.vue';
/* import wordMenu from './word-menu.vue'; */

import {
    CollectionList,
    CollectionWord
} from '../../store/modules/collection/index';

const StateCL = namespace('collection', State);
const GetterCL = namespace('collection', Getter);
const ActionCL = namespace('collection', Action);

@Component({
    components: {
        listItem
        //wordMenu
    }
})
export default class WordList extends Vue {
    @StateCL selectedLists: CollectionList[];
    @StateCL selectedWords: CollectionWord[];

    @GetterCL getPooledWords: CollectionWord[];

    @ActionCL
    addWord: (payload: { listId: string; word: CollectionWord }) => void;
    @ActionCL
    selectWord: (payload: { wordId: string; annex?: Boolean }) => void;
    @ActionCL deselectWord: (payload: { wordId: string }) => void;

    @Watch('getPooledWords')
    onGetPooledWordsChanged(value: CollectionWord[]): void {
        this.selectedWords.forEach(word => {
            if (!this.getPooledWords.includes(word)) {
                this.deselectWord({ wordId: word.id });
            }
        });
    }

    lookup: string = '';

    /* async mounted(): Promise<void> {
        window.setInterval(async () => {
            const card: any = await anki.guiCurrentCard();
            if (card !== null) {
                this.lookup = card.fields.Word.value;

                const word = new Word({ text: this.lookup });

                cSelectWord(this.$store, word);
            }
        }, 2000);
    } */

    blah = debounce(this.foobar, 500);

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
        const listId = this.selectedLists[0].id;
        const word = new CollectionWord({ text: this.lookup });

        this.addWord({ listId, word });
        this.selectWord({ wordId: word.id });

        /* if (this.isLookupNew) {
            this.addNewWord();
        } else {
            this.editWord(this.items[0]);
        } */
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

    /* selectWord(word: Word): void {
        cSelectWord(this.$store, word);
    } */

    removeWord(word: Word): void {
        cRemoveWord(this.$store, word);
        dSyncWords(this.$store);
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.list-view {
    width: 15em;
    flex-shrink: 0;
    margin-right: 16px;

    display: flex;
    flex-direction: column;
}

/* .container {
    display: flex;
    flex-direction: column;
}
 */

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
</style>
