<template>

    <section class="list-view">


        <section class="lookup">

            <div class="uk-margin">
                <input
                    class="uk-input"
                    type="text"
                    placeholder="Input"
                    v-model.trim="lookup"
                    @keyup.enter="addWordTemp">
            </div>

            <!-- <el-input
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
            </el-input> -->
        </section>

        <!-- <span class="text-smaller">{{ lookupHint }}</span> -->

        <section class="virtual-list-container" ref="virtualListContainer">
            <!-- <ul class="list">
                <list-item
                    v-for="word in getPooledWords"
                    :key="word.id"
                    @archive="archiveWord"
                    @edit="editWord"
                    v-on:remove="removeWord"
                    :word="word"></list-item>
            </ul> -->

            <virtual-list
                :size="36"
                :remain="visibleHeight"
                :bench="20"
                class="cm-scrollbar">


                <list-item
                    v-for="item in getPooledWords"
                    @select="selectWord"
                    @favourite="setWordFavourite"
                    @archive="setWordArchived"
                    @delete="deleteSelectedWords"
                    :key="item.id"
                    :word="item"></list-item>

            </virtual-list>

            <!-- <virtual-scroller class="scroller"
                style="height: 300px; overflow: scroll;"
                item-height="21"
                :items="getPooledWords">
                <template slot-scope="props">

                    <div class="item">gelp {{ props.item.id }}</div>

                </template>
            </virtual-scroller> -->

            <!-- <list-item
                        @archive="archiveWord"
                        @edit="editWord"
                        @remove="removeWord"
                        :key="props.itemKey"
                        :word="props.item"></list-item> -->

            <!-- <recycle-list
                style="height: 300px; overflow: scroll;"
                :items="getPooledWords"
                :itemHeight="20">
                <template slot-scope="props">
                    <div style="height: 20px;" >word:</div>

                </template>
            </recycle-list> -->

            <!--  -->

        </section>

        <div>
            <span>{{ getPooledWords.length }} words</span>
            <span v-if="selectedLists.length > 1"> {{ selectedLists.length }} lists</span>
        </div>

    </section>

</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';
import VirtualScrollList from 'vue-virtual-scroll-list';

import debounce from 'lodash/debounce';

import loglevel from 'loglevel';
loglevel.setDefaultLevel(loglevel.levels.TRACE);
const log: loglevel.Logger = loglevel.getLogger(`word-list`);

import anki from './../../api/anki';

import listItem from './list-item.vue';
/* import wordMenu from './word-menu.vue'; */

import { CollectionList, CollectionWord } from '../../store/modules/collection/index';

const StateCL = namespace('collection', State);
const GetterCL = namespace('collection', Getter);
const ActionCL = namespace('collection', Action);

@Component({
    components: {
        'virtual-list': VirtualScrollList,
        listItem

        //wordMenu
    }
})
export default class WordList extends Vue {
    @StateCL selectedLists: CollectionList[];
    @StateCL selectedWords: CollectionWord[];

    @GetterCL getPooledWords: CollectionWord[];

    @ActionCL addWord: (payload: { listId: string; word: CollectionWord }) => void;

    @ActionCL selectWord: (payload: { wordId: string; append?: Boolean }) => void;

    @ActionCL deselectWord: (payload: { wordId: string }) => void;

    @ActionCL setWordFavourite: (payload: { wordId: string; value: boolean }) => void;

    @ActionCL setWordArchived: (payload: { wordId: string; value: boolean }) => void;

    @ActionCL deleteWord: (payload: { wordId: string }) => void;

    @ActionCL deleteSelectedWords: () => void;

    @Watch('getPooledWords')
    onGetPooledWordsChanged(value: CollectionWord[]): void {
        this.selectedWords.slice().forEach(word => {
            if (!this.getPooledWords.includes(word)) {
                this.deselectWord({ wordId: word.id });
            }
        });
    }

    addWordTemp(): void {
        const listId = this.selectedLists[0].id;
        const word = new CollectionWord({ text: this.lookup });
        this.addWord({ listId, word });
    }

    /* get visibleHeight(): number {
        console.log('visible heigh');

        return this.$el ? this.$el.clientHeight / 36 : 0;
    } */

    // TODO: recompute the height when the window heighs is changing
    visibleHeight: number = -1;

    mounted(): void {
        this.visibleHeight = (<HTMLElement>this.$refs.virtualListContainer).clientHeight / 36;
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

    //blah = debounce(this.foobar, 500);

    /* foobar(a: any): void {
        console.log('!!!', a, this.lookup);
        if (!this.isLookupValid) {
            log.info(`[word-list] not a word`);

            cSelectWord(this.$store, null);
            return;
        }

        const word = new Word({ text: this.lookup });

        cSelectWord(this.$store, word);
    } */

    get isLookupValid(): boolean {
        return this.lookup !== '' && this.lookup !== null;
    }

    /* get lookupHint(): string {
        if (!this.isLookupValid) {
            return '';
        }

        return this.isLookupNew
            ? `Nothing found. Press 'Enter' to add to the list.`
            : `Already exists. Press 'Enter' to edit.`;
    } */

    /**
     * Checks if the lookup is a new word - it's not new if it has an exact duplicate.
     */
    /* get isLookupNew() {
        if (!this.isLookupValid) {
            return false;
        }

        const isNew = !this.items.some(result => result.text === this.lookup);

        return isNew;
    } */

    /* get items(): Word[] {
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


        return filteredItems;
    } */

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

    /* addNewWord(): void {
        cAddWord(this.$store, new Word({ text: this.lookup }));
        dSyncWords(this.$store);

        this.lookup = '';
    }

    archiveWord(word: Word): void {
        word.archived = true;
        dSyncWords(this.$store);
    } */

    /* editWord(word: Word): void {
        //cSelectWord(word);
        //this.$router.push({ name: 'editor', params: { id: word.id } });
        //EventBus.$emit(WORD_SELECTED, word);
    } */

    /* selectWord(word: Word): void {
        cSelectWord(this.$store, word);
    } */

    /* removeWord(word: Word): void {
        cRemoveWord(this.$store, word);
        dSyncWords(this.$store);
    } */
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.list-view {
    width: 15em;
    flex-shrink: 0;

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

.virtual-list-container {
    flex: 1;
}

.word-menu {
    text-align: right;
}
</style>
