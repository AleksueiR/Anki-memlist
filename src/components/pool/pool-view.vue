<template>
    <section class="pool-view uk-flex uk-flex-column uk-flex-none">
        <div class="list-header uk-flex uk-inline">
            <span class="uk-form-icon uk-form-icon"> <octo-icon name="search" scale="0.8"></octo-icon> </span>

            <input
                class="uk-input uk-form-small uk-margin-right"
                type="text"
                placeholder="lookup / add"
                minlength="3"
                :value="lookupValue"
                v-stream:input="lookupStream"
                @keyup.enter="addWordTemp"
            />
        </div>

        <!-- displays the lookup results from collections -->
        <keep-alive>
            <div v-if="isLookupValid" class="list-content cm-scrollbar uk-flex-1 uk-margin-small-top">
                <!-- TODO: style nothing found label -->
                <span v-if="lookupResults.length === 0">Nothing found</span>

                <div v-for="(searchGroup, index) in lookupResults" :key="index" class="uk-margin-bottom">
                    <div>
                        <span class="search-list-title"> {{ searchGroup.list.name }} </span>
                        <span class="item-word-count uk-flex-1 uk-text-muted">{{ searchGroup.items.length }}</span>
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
                        ></pool-entry>
                    </div>
                </div>
            </div>

            <!-- displays pooled words from the selected lists -->

            <div class="uk-flex uk-flex-column uk-flex-1 uk-margin-small-top" v-else v-bar>
                <!--
                    <div>
                        <button
                            uk-tooltip="delay: 500; title: View menu"
                            class="uk-button uk-button-none list-item-control"
                        >
                            blah
                            <octo-icon name="chevron-down"></octo-icon>
                        </button>
                    </div>
                -->

                <focusable-list
                    class="list-content"
                    v-model="focusedEntry"
                    :allEntries="getPooledWords"
                    @keydown.native.prevent.enter="selectWord({ wordId: focusedEntry.id });"
                    @keydown.native.prevent.space="setWordArchived({ wordId: focusedEntry.id });"
                    @keydown.native.prevent.f2="startRename(focusedEntry);"
                >
                    <template v-for="item in getPooledWords">
                        <rename-input
                            v-if="renamingEntry && item.id === renamingEntry.id"
                            :key="item.id"
                            :value="renamingEntry.text"
                            @complete="completeRename"
                        >
                        </rename-input>

                        <pool-entry
                            v-else
                            :key="item.id"
                            :word="item"
                            :isFocused="item === focusedEntry"
                            v-stay-in-view="item === focusedEntry"
                            v-drag-object="{ payload: item.id, tags: { 'drag-target': 'collection-item' } }"
                            @select="onWordSelected"
                            @favourite="setWordFavourite"
                            @archive="setWordArchived"
                            @rename="startRename"
                            @delete="deleteWords"
                        >
                        </pool-entry>
                    </template>
                </focusable-list>
            </div>
        </keep-alive>

        <div class="status-bar">
            <div class="status-bar-item uk-flex-1">
                <button class="status-bar-item-handle">
                    <span
                        >{{ getPooledWords.length }}
                        <strong>{{ displayModeLabels[poolDisplayMode] }} </strong> words </span
                    ><span v-if="selectedLists.length > 1"> in {{ selectedLists.length }} lists</span>

                    <template v-else></template>
                </button>
                <!--
                    <div class="status-bar-item-drop">
                        <ul>
                            <li>
                                <button @click.stop="setListDisplay({ listId: selectedLists[0].id, value: 0 });">
                                    Show active <span>{{ poolDisplayCount[0] }}</span>
                                </button>
                            </li>
                            <li>
                                <button @click.stop="setListDisplay({ listId: selectedLists[0].id, value: 1 });">
                                    Show new <span>{{ poolDisplayCount[1] }}</span>
                                </button>
                            </li>
                            <li>
                                <button @click.stop="setListDisplay({ listId: selectedLists[0].id, value: 2 });">
                                    Show archived <span>{{ poolDisplayCount[2] }}</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                -->

                <uk-dropdown :pos="'top-center'" :delay-hide="0">
                    <ul class="uk-nav uk-dropdown-nav">
                        <li>
                            <a href="#" @click.stop.prevent="setSelectedListsDisplay(0);"
                                >Show all {{ poolDisplayCount[0] }}</a
                            >
                        </li>
                        <li>
                            <a href="#" @click.stop.prevent="setSelectedListsDisplay(1);"
                                >Show active {{ poolDisplayCount[1] }}</a
                            >
                        </li>
                        <li>
                            <a href="#" @click.stop.prevent="setSelectedListsDisplay(2);"
                                >Show archived {{ poolDisplayCount[2] }}</a
                            >
                        </li>
                    </ul>
                </uk-dropdown>
            </div>
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
import RenameInputV from '@/components/bits/rename-input.vue';
import PoolEntryV from './pool-entry.vue';
// import VirtualScrollList from 'vue-virtual-scroll-list';

import loglevel from 'loglevel';
loglevel.setDefaultLevel(loglevel.levels.TRACE);
const log: loglevel.Logger = loglevel.getLogger(`word-list`);

// import anki from './../../api/anki';

/* import wordMenu from './word-menu.vue'; */

import { CollectionList, CollectionWord, CollectionDisplay, LookupResult } from '../../store/modules/collection/index';

import CollectionStateMixin from '@/mixins/collection-state-mixin';

import UkDropdownV from './../bits/uk-dropdown.vue';

const StateCL = namespace('collection', State);
const GetterCL = namespace('collection', Getter);
const ActionCL = namespace('collection', Action);

const collection = namespace('collection');
const display = namespace('display');

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
        'pool-entry': PoolEntryV,
        'rename-input': RenameInputV,
        'uk-dropdown': UkDropdownV
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
    @StateCL selectedLists: CollectionList[];
    @StateCL selectedWords: CollectionWord[];
    @StateCL lookupResults: LookupResult[];

    @GetterCL getPooledWords: CollectionWord[];

    @collection.Action setListDisplay: (payload: { listId: string; value: CollectionDisplay }) => void;

    @ActionCL addWord: (payload: { listId: string; word: CollectionWord }) => void;

    @ActionCL selectWord: (payload: { wordId: string; append?: Boolean; value?: boolean }) => void;

    @ActionCL setWordText: (payload: { wordId: string; value: string; searchAll?: boolean }) => void;

    @ActionCL setWordFavourite: (payload: { wordId: string; value: boolean }) => void;

    @ActionCL setWordArchived: (payload: { wordId: string; value: boolean }) => void;

    @ActionCL deleteWord: (payload: { wordId: string }) => void;

    @ActionCL deleteSelectedWords: () => void;

    @ActionCL performLookup: (options?: { value: string }) => void;

    // #region Display store

    /**
     * Loads wordbook definitions for the provided collection word.
     */
    @display.Action loadDefinitions: (payload: { value: CollectionWord }) => Promise<void>;

    // #endregion Display store

    /**
     * The currently focused entry.
     */
    focusedEntry: CollectionWord | null = null;

    /**
     * The entry being renamed.
     */
    renamingEntry: CollectionWord | null = null;

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
        this.$observables.lookupObservable.subscribe(value => {
            this.performLookup({ value });
            this.loadDefinitions({ value: new CollectionWord({ text: value }) });
        });
    }

    displayModeLabels = {
        [CollectionDisplay.all]: '',
        [CollectionDisplay.active]: 'active',
        [CollectionDisplay.archived]: 'archived',
        [CollectionDisplay.mixed]: 'mixed'
    };

    /**
     * Returns the display mode of the selected lists. If the modes do not align, returns -1;
     */
    get poolDisplayMode(): CollectionDisplay | -1 {
        const map = [0, 0, 0];
        this.selectedLists.forEach(l => map[l.display]++);
        const mode = map.findIndex(count => count === this.selectedLists.length);

        return mode;
    }

    get poolDisplayCount(): number[] {
        const result = [CollectionDisplay.all, CollectionDisplay.active, CollectionDisplay.archived];

        return result.map(mode => this.selectedLists.reduce<number>((count, l) => count + l.countWords(mode), 0));
    }

    /**
     * Sets the specified display mode to all the selected lists.
     */
    setSelectedListsDisplay(mode: CollectionDisplay): void {
        this.selectedLists.forEach(sl => this.setListDisplay({ listId: sl.id, value: mode }));
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
     * // TODO: why???
     */
    selectWordSearchAll(event: any) {
        this.selectWord({ ...event, searchAll: true });
    }

    onWordSelected(payload: { wordId: string; append: boolean }): void {
        // the word must be in the pool, otherwise it cannot be selected
        const word = this.getPooledWords.find(word => word.id === payload.wordId)!;
        this.focusedEntry = word!;

        this.selectWord(payload);

        this.loadDefinitions({ value: word });
    }

    /* onRenameComplete({ id, name }: { id: string; name?: string }) {
        if (!name) {
            return;
        }

        this.setWordText({ wordId: id, value: name });
    } */

    startRename(entry: CollectionWord): void {
        console.log(entry);

        this.focusedEntry = this.renamingEntry = entry;
    }

    completeRename(name?: string): void {
        // TODO: grey out the rest of the list on rename start

        if (!this.renamingEntry) {
            return;
        }

        if (name !== undefined && name !== '') {
            this.setWordText({ wordId: this.renamingEntry.id, value: name });
        }

        const entry = this.renamingEntry;
        this.renamingEntry = null;
        this.focusedEntry = entry;
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';
.pool-view {
    width: 15em;
    margin: 0;

    .list-header {
        height: 3rem;
        align-items: center;

        .uk-input {
            padding-left: 0 !important;
            margin-left: calc(0.5rem + 2rem);
            border-width: 0 0 1px 0;
        }
    }

    .list-content:focus {
        // TODO: outline line in VSCOde search?
        outline: none;
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

$hover-colour: rgba(
    $color: $accent-colour,
    $alpha: 0.1
);

.status-bar {
    display: flex;

    position: relative;

    border-top: 1px solid rgba(0, 0, 0, 0.08);

    font-size: 12px;

    .status-bar-item {
        .status-bar-item-handle {
            width: 100%;

            background: transparent;
            border: none;
            padding: 0 0.5rem;
            // margin: 0;

            height: 30px;
            line-height: 22px;

            text-align: left;

            cursor: pointer;

            &:focus {
                outline: none;
            }
        }

        .status-bar-item-drop {
            position: absolute;
            bottom: 27px;
            width: 100%;
            background-color: red;
        }

        &:hover {
            background-color: rgba(0, 0, 0, 0.08);
        }
    }
}
</style>
