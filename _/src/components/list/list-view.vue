<template>

    <section class="list-view uk-flex uk-flex-column uk-flex-none">

        <div class="list-header uk-flex uk-inline">
            <span class="uk-form-icon uk-form-icon">
                <octo-icon name="search" scale="0.8"></octo-icon>
            </span>

            <input
                class="uk-input uk-form-blank uk-form-small"

                type="text"
                placeholder="lookup / add"
                minlength="3"
                :value="lookupValue"
                v-stream:input="lookupStream"
                @keyup.enter="addWordTemp">
        </div>

        <div class="list-content cm-scrollbar uk-flex-1 uk-margin-small-top" v-if="isLookupValid">

            <!-- TODO: style nothing found label -->
            <span v-if="lookupResults.length === 0">Nothing found</span>

            <div
                v-for="(searchGroup, index) in lookupResults"
                :key="index"

                class="uk-margin-bottom">

                <div>
                    <span class="search-list-title"> {{ searchGroup.list.name }} </span>
                    <span
                        class="item-word-count uk-flex-1 uk-text-muted">{{ searchGroup.items.length }}</span>
                </div>

                <div class="uk-margin-small-top">
                    <list-item
                        v-for="item in searchGroup.items"
                        :key="item.id"
                        :word="item.word"

                        :class="{ 'perfect-match': item.score === 0 }"

                        @select="selectWordSearchAll"
                        @favourite="setWordFavourite"
                        @archive="setWordArchived"
                        @delete="deleteWords"

                        @rename-start="onRenameStart"
                        @rename-complete="onRenameComplete"
                        @rename-cancel="onRenameComplete"></list-item>
                </div>

            </div>

        </div>

        <div class="list-content uk-flex-1 uk-margin-small-top" ref="virtualListContainer" v-else>

            <virtual-list
                :size="30"
                :remain="visibleHeight"
                :bench="20"
                class="cm-scrollbar">

                <list-item
                    v-for="item in getPooledWords"
                    :key="item.id"
                    :word="item"

                    v-drag-object="{ payload: item.id, tags: { 'drag-target': 'collection-item' } }"

                    @select="selectWord"
                    @favourite="setWordFavourite"
                    @archive="setWordArchived"
                    @delete="deleteWords"

                    @rename-start="onRenameStart"
                    @rename-complete="onRenameComplete"
                    @rename-cancel="onRenameComplete"></list-item>

            </virtual-list>

        </div>

        <div>
            <span>{{ getPooledWords.length }} words</span>
            <span v-if="selectedLists.length > 1"> in {{ selectedLists.length }} lists</span>
        </div>

    </section>

</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';
import { mixins } from 'vue-class-component';

import VirtualScrollList from 'vue-virtual-scroll-list';

import loglevel from 'loglevel';
loglevel.setDefaultLevel(loglevel.levels.TRACE);
const log: loglevel.Logger = loglevel.getLogger(`word-list`);

import anki from './../../api/anki';

import listItem from './list-item.vue';
/* import wordMenu from './word-menu.vue'; */

import { CollectionList, CollectionWord, LookupResult } from '../../store/modules/collection/index';

import CollectionStateMixin from '@/mixins/collection-state-mixin';

const StateCL = namespace('collection', State);
const GetterCL = namespace('collection', Getter);
const ActionCL = namespace('collection', Action);

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription'; // Disposable if using RxJS4
import { Subject } from 'rxjs/Subject'; // required for domStreams option

import 'rxjs/add/operator/do';
import 'rxjs/add/operator/pluck';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/fromEvent';

const messageObservable = Observable.from(['Example Message', 'Example Message Final']);

enum Streams {
    lookup = 'lookupStream'
}

// TODO: update when vetur extension is updated to use [Streams.lookup]: Observable<Event>;
interface VueStream extends Vue {
    lookupStream: Observable<Event>;
}

@Component({
    components: {
        'virtual-list': VirtualScrollList,
        listItem
    },
    domStreams: [Streams.lookup],
    subscriptions() {
        const vues: VueStream = this as VueStream;

        return {
            lookupObservable: vues.lookupStream.debounceTime(300).pluck<Event, string>('event', 'target', 'value')
        };
    }
})
export default class WordList extends mixins(CollectionStateMixin) {
    @StateCL selectedLists: CollectionList[];
    @StateCL selectedWords: CollectionWord[];
    @StateCL lookupResults: LookupResult[];

    @GetterCL getPooledWords: CollectionWord[];

    @ActionCL addWord: (payload: { listId: string; word: CollectionWord }) => void;

    @ActionCL selectWord: (payload: { wordId: string; append?: Boolean; value?: boolean }) => void;

    @ActionCL setWordText: (payload: { wordId: string; value: string; searchAll?: boolean }) => void;

    @ActionCL setWordFavourite: (payload: { wordId: string; value: boolean }) => void;

    @ActionCL setWordArchived: (payload: { wordId: string; value: boolean }) => void;

    @ActionCL deleteWord: (payload: { wordId: string }) => void;

    @ActionCL deleteSelectedWords: () => void;

    @ActionCL performLookup: (options?: { value: string }) => void;

    // TODO: this doesn't seem to belong here
    @Watch('getPooledWords')
    onGetPooledWordsChanged(value: CollectionWord[]): void {
        // deselect words which are no longer in the pool
        // TODO: this doesn't seem to work properly
        this.selectedWords.slice().forEach(word => {
            if (!this.getPooledWords.includes(word)) {
                console.log('deselecting', word);

                this.selectWord({ wordId: word.id, value: false });
            }
        });
    }

    created() {
        this.$observables.lookupObservable.subscribe(value => this.performLookup({ value }));
    }

    get isLookupValid(): boolean {
        return this.lookupValue !== '';
    }

    addWordTemp(): void {
        const listId = this.selectedLists[0].id;
        const word = new CollectionWord({ text: this.lookupValue });
        this.addWord({ listId, word });

        this.performLookup();
    }

    deleteWords({ wordId }: { wordId: string }): void {
        const word = this.selectedWords.find(word => word.id === wordId);
        if (word) {
            this.deleteSelectedWords();
        } else {
            this.deleteWord({ wordId });
        }
    }

    /**
     * Selects the word even if it's not in the selected list.
     */
    selectWordSearchAll(event: any) {
        this.selectWord({ ...event, searchAll: true });
    }

    /* get visibleHeight(): number {
        console.log('visible heigh');

        return this.$el ? this.$el.clientHeight / 36 : 0;
    } */

    // TODO: recompute the height when the window heighs is changing
    visibleHeight: number = -1;

    mounted(): void {
        this.visibleHeight = (<HTMLElement>this.$refs.virtualListContainer).clientHeight / 30;
    }

    /* async performLookup(value: string) {
        this.wordLookup = value;
        // this.performLookup2(value);
    } */

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

    /* get isLookupValid(): boolean {
        return this.lookup !== '' && this.lookup !== null;
    } */

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

    /* addNewWord(): void {
        cAddWord(this.$store, new Word({ text: this.lookup }));
        dSyncWords(this.$store);

        this.lookup = '';
    }

    archiveWord(word: Word): void {
        word.archived = true;
        dSyncWords(this.$store);
    } */

    onRenameStart({ id }: { id: string }) {
        // TODO: grey out the rest of the list
    }

    onRenameComplete({ id, name }: { id: string; name?: string }) {
        if (!name) {
            return;
        }

        this.setWordText({ wordId: id, value: name });
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.list-view {
    width: 15em;

    .list-header {
        height: 3rem;
        align-items: center;

        .uk-input {
            padding-left: calc(0.5rem + 30px - 1px) !important;

            // always show border
            border-color: #e5e5e5;
            border-style: dashed;
        }
    }

    .list-content /deep/ {
        .perfect-match {
            background-color: rgba($color: green, $alpha: 0.1);
        }
    }
}

// TODO: fake
.search-list-title {
    font-weight: 500;
    padding-left: calc(0.5rem + 30px - 1px) !important;
}

.item-word-count {
    // line-height: 30px;
    text-align: right;
    padding-left: 0.5rem;
    // font-size: 0.8em;
}

.word-menu {
    text-align: right;
}
</style>
