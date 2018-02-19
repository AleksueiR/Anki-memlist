<template>
    <section class="collection-view">

        <nav class="toolbar">

            <el-button class="button">
                <font-awesome-icon icon="file" />
            </el-button>

        </nav>

        <div class="collection" >

            <el-button class="button" @click="createNewList" type="plain">
                <font-awesome-icon icon="plus" /> Add List
            </el-button>

            <treee
                class="treee"
                v-model="treeItems"
                :draggable="isTreeDraggable"
                :renderer="renderer"
                @node-click="nodeClick">
            </treee>

            <hr>

            current key: {{ currentKey }};

            <div v-for="list in lists" :key="list.id"> {{ list.index.length }}</div>
        </div>

    </section>
</template>

<script lang="ts">
/**
 * TODO: use keyboard events to move the focus up and down the tree, as it seems the build it focus moves but does not change the current node key to go with it
 */

import {
    Vue,
    Component,
    Provide,
    Model,
    Prop,
    Watch,
    Emit
} from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';

import FontAwesomeIcon from '@fortawesome/vue-fontawesome';

import CollectionItemV from './collection-item.vue';
import Treee from './../treee/treee.vue';

import {
    CollectionState,
    CollectionTree,
    CollectionIndex,
    CollectionList
} from '../../store/modules/collection';

import CollectionBus from './collection-bus';

const StateCL = namespace('collection', State);
const ActionCL = namespace('collection', Action);

@Component({
    components: {
        FontAwesomeIcon,
        Treee
    }
})
export default class CollectionView extends Vue {
    @Provide() bus = new CollectionBus();

    renderer = CollectionItemV;

    // #region vuex

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

    @StateCL index: CollectionIndex;
    @StateCL lists: Map<string, CollectionList>;
    @StateCL selectedLists: CollectionList[];
    @StateCL((state: CollectionState) => state.index.defaultListId)
    defaultListId: string;

    // replaces the existing tree index with the new one
    @ActionCL setIndexTree: (options: { tree: CollectionTree }) => void;
    // adds a new list to the bottom of the top level of the list tree
    @ActionCL addList: (list: CollectionList) => void;
    // sets a new list name
    @ActionCL setListName: (payload: { listId: string; name: string }) => void;
    // select the list
    @ActionCL
    selectList: (
        { listId, annex }: { listId: string; annex?: boolean }
    ) => void;
    @ActionCL deselectList: (value: { listId: string }) => void;

    // #endregion vuex

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
        if (
            this.selectedLists.find(list => list.id === node.listId) &&
            event.ctrlKey
        ) {
            this.deselectList({ listId: node.listId });
        } else {
            this.selectList({ listId: node.listId, annex: event.ctrlKey });
        }
    }

    ctrlPressed: boolean = false;

    currentKey: string = '';

    keyDownHandler(event: KeyboardEvent): void {
        // assume at least one list is selected
        if (
            event.keyCode === Vue.config.keyCodes.f2 &&
            this.selectedLists.length > 0
        ) {
            // this.renamedListId = this.selectedLists[0].id;

            event.preventDefault();
            this.isTreeDraggable = false;
            this.bus.renameStart(this.selectedLists[0].id);
        }

        // track ctrl key
        // TODO: move ctrl tracking up to the app-level
        if (event.keyCode === Vue.config.keyCodes.ctrl) {
            this.ctrlPressed = true;
        }

        console.log(event.keyCode, 'is pressed');
    }

    keyUpHandler(event: KeyboardEvent): void {
        if (event.keyCode === Vue.config.keyCodes.ctrl) {
            this.ctrlPressed = false;
        }
    }

    mounted() {
        this.$el.addEventListener('keydown', this.keyDownHandler);
        this.$el.addEventListener('keyup', this.keyUpHandler);

        this.bus.$on('rename-complete', this.onRenameComplete);
    }

    onRenameComplete(listId: string, name: string) {
        this.isTreeDraggable = true;

        this.setListName({ listId, name });

        // TODO: is this needed?
        this.$el.focus();
    }

    /**
     * Creates a new list and adds it to the collection.
     * After the CollectionItemV is mounted, start renaming the list so the user can change its name.
     */
    createNewList(): void {
        const list = new CollectionList();
        this.addList(list);

        this.bus.$on('mount-complete', (listId: string) => {
            if (listId !== list.id) {
                return;
            }

            this.bus.$off('mount-complete');
            this.bus.renameStart(list.id);
        });
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.collection-view {
    border-right: 1px solid $dark-secondary-colour;
    //width: 13em;
    width: 20em;

    flex-shrink: 0;
    display: flex;
}

.toolbar {
    $toolbar-width: 3em;

    border-right: 1px solid $dark-secondary-colour;
    width: $toolbar-width;
    flex-shrink: 0;

    display: flex;
    flex-direction: column;
    align-items: center;

    .button {
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
    }
}

.collection {
    flex: 1;
    display: flex;
    flex-direction: column;

    .el-tree {
        flex: 1;
    }
}

.treee /deep/ {
    .divider {
        margin-left: 1.5rem;
    }
}

/* .el-tree /deep/ {
    color: $text-colour;
    user-select: none;

    // move caret icon to the right
    .el-tree-node__expand-icon {
        order: 1;
        transform: rotate(90deg);

        &.expanded {
            transform: rotate(-90deg);
        }
    }

    .el-tree-node {
        &:focus > .el-tree-node__content {
            background-color: transparent;
        }

        &.is-checked > .el-tree-node__content {
            background-color: darken($secondary-colour, 10%);
        }

        &:hover > .el-tree-node__content {
            background-color: $secondary-colour;
        }
    }
} */
</style>
