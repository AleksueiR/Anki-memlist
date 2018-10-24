<template>

    <section
        class="list-view uk-flex uk-flex-column uk-flex-none">

        <div class="list-header uk-flex uk-inline">
            <span class="uk-form-icon uk-form-icon">
                <octo-icon name="search" scale="0.8"></octo-icon>
            </span>

            <input
                class="uk-input uk-form-small"

                type="text"
                placeholder="lookup / add"
                minlength="3"
                :value="lookupValue"
                v-stream:input="lookupStream"
                @keyup.enter="addWordTemp">
        </div>

        <!-- displays the lookup results from collections -->
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
                    <pool-entry
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
                        @rename-cancel="onRenameComplete"></pool-entry>
                </div>

            </div>

        </div>

        <!-- displays pooled words from the selected lists -->

        <focusable-list
            tabindex="0"
            class="list-content uk-flex-1 uk-margin-small-top cm-scrollbar"

            :entry="focusedEntry"
            :allEntries="getPooledWords"
            @change="value => focusedEntry = value"

            @keydown.native.prevent.enter="selectWord({ wordId: focusedEntry.id })"
            @keydown.native.prevent.space="setWordArchived({ wordId: focusedEntry.id })"

            v-else>

            <pool-entry
                v-for="item in getPooledWords"
                :key="item.id"
                :word="item"
                :isFocused="item === focusedEntry"

                v-stay-in-view="item === focusedEntry"
                v-drag-object="{ payload: item.id, tags: { 'drag-target': 'collection-item' } }"

                @select="onWordSelected"
                @favourite="setWordFavourite"
                @archive="setWordArchived"
                @delete="deleteWords"

                @rename-start="onRenameStart"
                @rename-complete="onRenameComplete"
                @rename-cancel="onRenameComplete">
            </pool-entry>

        </focusable-list>

        <div>
            <span>{{ getPooledWords.length }} words</span>
            <span v-if="selectedLists.length > 1"> in {{ selectedLists.length }} lists</span>
        </div>

    </section>

</template>

<script lang="ts">
import Vue, { VNodeDirective } from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';
import { mixins } from 'vue-class-component';

import { StayInView } from '@/directives/stay-in-view';
import FocusableListV from '@/components/bits/focusable-list.vue';
// import VirtualScrollList from 'vue-virtual-scroll-list';

import loglevel from 'loglevel';
loglevel.setDefaultLevel(loglevel.levels.TRACE);
const log: loglevel.Logger = loglevel.getLogger(`word-list`);

// import anki from './../../api/anki';

import poolEntryV from './pool-entry.vue';
/* import wordMenu from './word-menu.vue'; */

import { CollectionList, CollectionWord, LookupResult } from '../../store/modules/collection/index';

import CollectionStateMixin from '@/mixins/collection-state-mixin';

const StateCL = namespace('collection', State);
const GetterCL = namespace('collection', Getter);
const ActionCL = namespace('collection', Action);

import { Observable, Subscription, Subject } from 'rxjs';
import { debounceTime, pluck } from 'rxjs/operators';
// const messageObservable = Observable.from(['Example Message', 'Example Message Final']);

enum Streams {
    lookup = 'lookupStream'
}

// TODO: update when vetur extension is updated to use [Streams.lookup]: Observable<Event>;
interface VueStream extends Vue {
    lookupStream: Observable<Event>;
}

@Component({
    components: {
        'focusable-list': FocusableListV,
        'pool-entry': poolEntryV
    },
    domStreams: [Streams.lookup],
    subscriptions() {
        const vues: VueStream = this as VueStream;

        return {
            lookupObservable: vues.lookupStream.pipe(
                debounceTime(300),
                pluck<Event, string>('event', 'target', 'value')
            )
        };
    },
    directives: {
        StayInView
    }
})
export default class PoolViewV extends mixins(CollectionStateMixin) {
    @StateCL
    selectedLists: CollectionList[];
    @StateCL
    selectedWords: CollectionWord[];
    @StateCL
    lookupResults: LookupResult[];

    @GetterCL
    getPooledWords: CollectionWord[];

    @ActionCL
    addWord: (payload: { listId: string; word: CollectionWord }) => void;

    @ActionCL
    selectWord: (payload: { wordId: string; append?: Boolean; value?: boolean }) => void;

    @ActionCL
    setWordText: (payload: { wordId: string; value: string; searchAll?: boolean }) => void;

    @ActionCL
    setWordFavourite: (payload: { wordId: string; value: boolean }) => void;

    @ActionCL
    setWordArchived: (payload: { wordId: string; value: boolean }) => void;

    @ActionCL
    deleteWord: (payload: { wordId: string }) => void;

    @ActionCL
    deleteSelectedWords: () => void;

    @ActionCL
    performLookup: (options?: { value: string }) => void;

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

    onWordSelected(payload: { wordId: string; append: boolean }): void {
        const word = this.getPooledWords.find(word => word.id === payload.wordId);
        this.focusedEntry = word!;

        this.selectWord(payload);
    }

    onRenameStart({ id }: { id: string }) {
        // TODO: grey out the rest of the list
    }

    onRenameComplete({ id, name }: { id: string; name?: string }) {
        if (!name) {
            return;
        }

        this.setWordText({ wordId: id, value: name });
    }

    /**
     * The currently focused entry.
     */
    focusedEntry: CollectionWord | null = null;
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.list-view:focus {
    border: 1px solid red;
}

.list-view {
    width: 15em;

    .list-header {
        height: 3rem;
        align-items: center;

        .uk-input {
            padding-left: calc(0.5rem + 30px - 1px) !important;
        }
    }

    .list-content:focus {
        // outline: none;
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
