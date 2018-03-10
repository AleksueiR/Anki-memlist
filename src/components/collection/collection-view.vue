<template>
    <section class="collection-view uk-flex uk-flex-none">

        <nav class="toolbar uk-flex uk-flex-column">

            <a href="" uk-icon="album" class="uk-padding-small uk-icon"
                :class="{ selected: isExpanded }"
                @click.prevent="toggleIsExpanded"></a>

        </nav>

        <div class="collection cm-scrollbar" v-show="isExpanded">

            <!-- <div class="uk-inline">
                <button class="uk-button uk-button-default uk-icon-button" type="button" uk-icon="icon: plus; ratio: 0.7">Hover</button>
                <div uk-dropdown>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.</div>
            </div>

            <button class="uk-button uk-button-default uk-width-1-1 uk-margin-small-bottom">Button</button> -->

            <el-button class="button" @click="createNewList" type="plain">
                <font-awesome-icon icon="plus" /> Add List
            </el-button>

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
                        @rename-start="onRenameStart"
                        @rename-complete="onRenameComplete"
                        @rename-cancel="onRenameComplete">
                    </collection-item>
                </template>
            </treee>

        </div>

    </section>
</template>

<script lang="ts">
/**
 * TODO: use keyboard events to move the focus up and down the tree, as it seems the build it focus moves but does not change the current node key to go with it
 */
import { Vue, Component, Provide, Model, Prop, Watch, Emit } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';

import FontAwesomeIcon from '@fortawesome/vue-fontawesome';

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
        FontAwesomeIcon,
        Treee,
        'collection-item': CollectionItemV
    }
})
export default class CollectionView extends Vue {
    // #region vuex

    @StateCL index: CollectionIndex;

    @ActionCL setIndexDefaultList: (payload: { listId: string }) => void;

    @ActionCL setIndexExpandedTree: (payload: { listId: string; value: boolean }) => void;

    @ActionCL setListPinned: (payload: { listId: string; value: boolean }) => void;

    // replaces the existing tree index with the new one
    @ActionCL setIndexTree: (options: { tree: CollectionTree }) => void;

    // adds a new list to the bottom of the top level of the list tree
    @ActionCL addList: (list: CollectionList) => void;

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

.collection-view {
    // width: 20em;

    // flex-shrink: 0;
    // display: flex;
}

.toolbar {
    // $toolbar-width: 3em;

    border: 1px solid $dark-secondary-colour;
    border-width: 0 1px 0 1px;
    // width: $toolbar-width;
    flex-shrink: 0;

    .selected {
        color: $accent-colour;
    }

    /* display: flex;
    flex-direction: column;
    align-items: center; */

    /* .button {
        border: none;
        width: $toolbar-width;
        height: $toolbar-width;
        border-radius: 0;
        padding: 0;
        margin: 0;
        background-color: transparent;

        svg {
            width: $toolbar-width / 2;
            height: $toolbar-width / 2;
        }
    } */
}

.collection {
    width: 16em;

    /* flex: 1;
    display: flex;
    flex-direction: column; */

    .el-tree {
        flex: 1;
    }
}

.treee {
    /deep/ .divider {
        margin-left: calc(0.5rem + 30px);
    }

    &.dragging /deep/ {
        .collection-item {
            .highlight,
            .icon-button {
                display: none;
            }
        }
    }
}
</style>
