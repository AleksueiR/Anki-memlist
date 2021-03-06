<template>
    <section class="collection-view uk-flex uk-flex-column uk-flex-none">
        <div class="collection-header uk-flex">
            <span class="title uk-flex-1">Collections</span>

            <button @click="createNewList" uk-tooltip="delay: 500; title: New" class="uk-button uk-button-none">
                <octo-icon name="plus"></octo-icon>
            </button>
        </div>

        <div class="uk-flex uk-flex-column uk-flex-1" v-bar>
            <focusable-list
                class="collection-tree uk-margin-small-top uk-flex-1"
                v-model="focusedEntry"
                :allEntries="flattenedTreeItems"
                @keydown.native.prevent.f2="startRename(focusedEntry)"
                @keydown.native.prevent.enter="selectList({ listId: focusedEntry.listId, append: $event.ctrlKey })"
                @keydown.native.prevent.space="setListPinned({ listId: focusedEntry.listId, value: !lists[focusedEntry.listId].pinned })"
                @keydown.native.prevent.right="setIndexExpandedTree({ listId: focusedEntry.listId, value: true })"
                @keydown.native.prevent.left="setIndexExpandedTree({ listId: focusedEntry.listId, value: false })"
            >
                <treee class="treee" v-model="treeItems" :draggable="isTreeDraggable" @node-click="nodeClick">
                    <template slot-scope="{ item, level }">
                        <rename-input
                            v-if="renamingEntry && item.listId === renamingEntry.listId"
                            :key="item.id"
                            :value="lists[renamingEntry.listId].name"
                            @complete="completeRename"
                        >
                        </rename-input>

                        <collection-item
                            v-else
                            :class="`level-${level}`"
                            :item="item"
                            :mint-list-id="mintListId"
                            :isFocused="focusedEntry && item.listId === focusedEntry.listId"
                            v-drag-target="{ payload: item.listId, onDrop: onListItemDrop }"
                            @default="setIndexDefaultList"
                            @pinned="setListPinned"
                            @expanded="setIndexExpandedTree"
                            @rename="startRename"
                            @import="openImport"
                            @delete="deleteLists"
                        >
                        </collection-item>
                    </template>
                </treee>
            </focusable-list>
        </div>
    </section>
</template>

<script lang="ts">
/**
 * TODO: use keyboard events to move the focus up and down the tree, as it seems the build it focus moves but does not change the current node key to go with it
 */
import { Vue, Component, Provide, Model, Prop, Watch, Emit } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';
import { mixins } from 'vue-class-component';

import UIkit from 'uikit';

import { DragObject, DragTarget } from '@/am-drag.plugin';

import Treee from './../treee/treee.vue';
import CollectionItemV from './collection-item.vue';
import RenameInputV from '@/components/bits/rename-input.vue';
import FocusableListV from '@/components/bits/focusable-list.vue';

import {
    CollectionState,
    CollectionTree,
    CollectionIndex,
    CollectionList,
    CollectionWord,
    CollectionListMap
} from '../../store/modules/collection';
import CollectionStateMixin from '@/mixins/collection-state-mixin';

const StateCL = namespace('collection', State);
const GetterCL = namespace('collection', Getter);
const ActionCL = namespace('collection', Action);

@Component({
    components: {
        Treee,
        'focusable-list': FocusableListV,
        'collection-item': CollectionItemV,
        'rename-input': RenameInputV
    }
})
export default class CollectionView extends mixins(CollectionStateMixin) {
    // #region vuex

    @StateCL selectedLists: CollectionList[];

    @GetterCL doesExist: (value: string) => boolean;

    @ActionCL addWord: (payload: { listId: string; word: CollectionWord | CollectionWord[] }) => void;

    @ActionCL setIndexDefaultList: (payload: { listId: string }) => void;

    @ActionCL setIndexExpandedTree: (payload: { listId: string; value: boolean }) => void;

    @ActionCL setListPinned: (payload: { listId: string; value: boolean }) => void;

    // replaces the existing tree index with the new one
    @ActionCL setIndexTree: (payload: { tree: CollectionTree }) => void;

    // adds a new list to the bottom of the top level of the list tree
    @ActionCL addList: (list: CollectionList) => void;

    @ActionCL deleteList: (payload: { listId: string }) => void;

    // sets a new list name
    @ActionCL setListName: (payload: { listId: string; value: string }) => void;

    // select the list
    @ActionCL selectList: ({ listId, append }: { listId: string; append?: boolean }) => void;

    // #endregion vuex

    /**
     * The currently focused tree item.
     */
    focusedEntry: CollectionTree | null = null;

    /**
     * The `CollectionList` being renamed.
     */
    renamingEntry: CollectionTree | null = null;

    // Treee needs a sturcture without circular dependencies
    // returns a safe list
    get treeItems() {
        return this.index.tree.safeJSON.items!;
    }

    // updates the underlying tree structure after items in the Treee are reordered
    set treeItems(items: CollectionTree[]) {
        console.log('set tree items', items);

        const newIndexTree = new CollectionTree({ items }, this.index);
        this.setIndexTree({ tree: newIndexTree });
    }

    /**
     * Returns a flattened list of `CollectionTree` items excluding children of collapsed sections.
     */
    get flattenedTreeItems(): CollectionTree[] {
        const stack: CollectionTree[] = [];
        const array: CollectionTree[] = []; // output

        stack.push.apply(stack, this.index.tree.items);

        while (stack.length !== 0) {
            const node = stack.shift()!;

            array.push(node);

            if (!node.expanded) {
                continue;
            }
            if (node.items.length !== 0) {
                stack.unshift.apply(stack, node.items.slice());
            }
        }

        return array;
    }

    /**
     * The id of the newly created list. It's used to immediatelly start the renaming process.
     *
     */
    mintListId: string | null = null;

    /**
     * Specifies if the Treee can be reordered.
     * When a list is being renamed, this is set to false to prevent erroneous handling mouse events.
     */
    isTreeDraggable: boolean = true;

    /**
     * Handles the click on a tree node.
     * If the clicked list is not yet selected, adds to the selection array. (holding Ctrl key appends it to already selected lists)
     * If the clicked list is already selected, removes from the selection array. (not holding Ctrl key will deselected everything except the one clicked)
     */
    // TODO: replace CollectionTree with CollectionTree.Untyped here
    nodeClick(node: CollectionTree, event: MouseEvent): void {
        this.selectList({ listId: node.listId, append: event.ctrlKey });

        // original Collection Tree elements contains circular links to the root and cannot be passed directly to the tree
        // a safeJSON extract is passed instead - need to find the original CollectionTree item before setting it to the focused entry
        this.focusedEntry = this.flattenedTreeItems.find(ti => ti.listId === node.listId)!;
    }

    /* onRenameStart({ id }: { id: string }) {
        // TODO: maybe don't block dragging on rename
        this.isTreeDraggable = false;
    }

    onRenameComplete({ id, name }: { id: string; name?: string }) {
        this.isTreeDraggable = true;
        this.mintListId = null;

        if (!name) {
            return;
        }

        this.setListName({ listId: id, value: name });
    } */

    openImport({ listId }: { listId: string }): void {
        const dialog = UIkit.modal.dialog(`
            <div class="uk-modal-body">
                <h2 class="uk-modal-title">Import</h2>

                <div class="uk-margin">
                    <textarea class="uk-textarea" rows="5" placeholder="Textarea" autofocus></textarea>
                </div>


                <p class="uk-text-right">
                    <button class="uk-button uk-button-default uk-modal-close" type="button">Cancel</button>
                    <button class="uk-button uk-button-primary submit-button" type="button">Ok</button>
                </p>
            </div>

        `);

        UIkit.util.on(dialog.$el, 'click', '.submit-button', (event: Event) => {
            const lines = ((dialog.$el.querySelector('.uk-textarea').value as string) || '')
                .split(/\r?\n/)
                .filter(l => l)
                .map(l => l.trim());
            const filteredLines = lines.filter(l => !this.doesExist(l));

            const words = filteredLines.map(line => new CollectionWord({ text: line }));

            console.log(`importing ${lines.length} words; ${lines.length - filteredLines.length} skipped`);
            console.log(
                'skipped:',
                lines.filter(l => this.doesExist(l))
            );

            this.addWord({ listId, word: words });

            dialog.hide();
        });
    }

    deleteLists({ listId }: { listId: string }): void {
        const list = this.selectedLists.find(list => list.id === listId);
        if (list) {
            // this.deleteSelectedLists();
            this.deleteList({ listId });
        } else {
            this.deleteList({ listId });
        }
    }

    /**
     * Creates a new list and adds it to the collection.
     * After the CollectionItemV is mounted, start renaming the list so the user can change its name.
     */
    createNewList(): void {
        const list = new CollectionList();
        this.mintListId = list.id;
        this.addList(list);
    }

    /**
     * Moves the word from its present list to a new list given the word and list ids.
     */
    onListItemDrop(event: MouseEvent, { payload: wordId }: DragObject, { payload: listId }: DragTarget): void {
        console.log('move item', wordId, 'to', listId);

        this.moveWord({ wordId: wordId as string, listId: listId as string });
    }

    startRename(entry: CollectionTree): void {
        console.log(entry);

        // TODO: replace CollectionTree with CollectionTree.Untyped here ???
        // original Collection Tree elements contains circular links to the root and cannot be passed directly to the tree
        // a safeJSON extract is passed instead - need to find the original CollectionTree item before setting it to the focused entry
        const trueEntry = this.flattenedTreeItems.find(ti => ti.listId === entry.listId)!;

        this.focusedEntry = this.renamingEntry = trueEntry;
    }

    completeRename(name?: string): void {
        // TODO: grey out the rest of the list on rename start

        if (!this.renamingEntry) {
            return;
        }

        if (name !== undefined && name !== '') {
            this.setListName({ listId: this.renamingEntry.listId, value: name });
        }

        this.mintListId = null;

        const entry = this.renamingEntry;
        this.renamingEntry = null;
        this.focusedEntry = entry;
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.collection-view {
    width: 16em;
    margin: 0;

    .collection-header {
        margin-left: calc(0.5rem + 30px);
        padding: 0 0.5rem 0 0;

        height: 3rem;
        align-items: center;

        .title {
            font-size: 1.2rem;
        }
    }

    .collection-tree {
        outline: none;
    }
}

.treee {
    &.dragging /deep/ {
        // hide icons while dragging collection items
        .collection-item .item-control {
            display: none;
        }

        // offset all tree dividers shown while draggin
        .divider {
            margin-left: calc(0.5rem + 30px);
        }
    }

    .drag-target-active {
        border: 1px solid blue;
    }
}
</style>
