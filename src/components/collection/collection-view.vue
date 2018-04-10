<template>
    <section class="collection-view uk-flex uk-flex-none">

        <div class="collection uk-flex uk-flex-column" v-show="isExpanded">

            <div class="collection-header uk-flex uk-flex-none">
                <span class="title uk-flex-1">Collections</span>
                <a
                    href="#"
                    @click="createNewList"
                    uk-tooltip="delay: 500; title: New"
                    class="uk-icon item-control favourite">
                    <octo-icon name="plus"></octo-icon>
                </a>
            </div>

            <div class="cm-scrollbar uk-margin-small-top">
                <treee
                    class="treee"
                    v-model="treeItems"
                    :draggable="isTreeDraggable"
                    @node-click="nodeClick">

                    <template slot-scope="{ item, level }">
                        <collection-item
                            :class="`level-${level}`"
                            :item="item"
                            :mint-list-id="mintListId"

                            @default="setIndexDefaultList"
                            @pinned="setListPinned"
                            @expanded="setIndexExpandedTree"
                            @delete="deleteLists"

                            @rename-start="onRenameStart"
                            @rename-complete="onRenameComplete"
                            @rename-cancel="onRenameComplete">
                        </collection-item>
                    </template>
                </treee>
            </div>

        </div>

    </section>
</template>

<script lang="ts">
/**
 * TODO: use keyboard events to move the focus up and down the tree, as it seems the build it focus moves but does not change the current node key to go with it
 */
import { Vue, Component, Provide, Model, Prop, Watch, Emit } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';

import CollectionItemV from './collection-item.vue';
import Treee from './../treee/treee.vue';

import {
    CollectionState,
    CollectionTree,
    CollectionIndex,
    CollectionList,
    CollectionWord,
    CollectionListMap
} from '../../store/modules/collection';

const StateCL = namespace('collection', State);
const GetterCL = namespace('collection', Getter);
const ActionCL = namespace('collection', Action);

@Component({
    components: {
        Treee,
        'collection-item': CollectionItemV
    }
})
export default class CollectionView extends Vue {
    // #region vuex

    @StateCL index: CollectionIndex;

    @StateCL selectedLists: CollectionList[];

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

    // Treee needs a sturcture without circular dependencies
    // returns a safe list
    get treeItems() {
        return this.index.tree.safeJSON.items!;
    }

    // ipdates the underlying tree structure after items in the Treee are reordered
    set treeItems(items: CollectionTree[]) {
        console.log('set tree items', items);

        const newIndexTree = new CollectionTree({ items }, this.index);
        this.setIndexTree({ tree: newIndexTree });
    }

    isExpanded: boolean = true;

    toggleIsExpanded(): void {
        this.isExpanded = !this.isExpanded;
    }

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
    nodeClick(node: CollectionTree, event: MouseEvent): void {
        this.selectList({ listId: node.listId, append: event.ctrlKey });
    }

    onRenameStart({ id }: { id: string }) {
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
    }

    deleteLists({ listId }: { listId: string }): void {
        const list = this.selectedLists.find(list => list.id === listId);
        if (list) {
            // this.deleteSelectedLists();
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
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.collection {
    width: 16em;

    .collection-header {
        margin-left: calc(0.5rem + 30px);
        padding: 0.5rem 0.5rem 0 0;
        // border-bottom: 1px solid rgba(0, 0, 0, 0.24);

        .title {
            font-size: 1.2rem;
        }
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
}
</style>
