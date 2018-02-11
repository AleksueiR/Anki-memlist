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

            <!-- <el-tree
                :data="index.tree.items"
                :expand-on-click-node="false"
                :props="treeProps"
                node-key="listId"
                :show-checkbox="false"
                :check-strictly="true"
                :highlight-current="false"
                :render-content="renderContent"
                @node-click="nodeClick"
                ref="tree"></el-tree> -->

            <!-- {{ getListWordCount('jd3sysjs') }} -->

            selected Nodes: {{ selectedNodes }}
            current key: {{ currentKey }};
            renamedListId: {{ renamedListId }}
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
import { Tree } from 'element-ui/types';

import CollectionItem from './collection-item.vue';
import treee from './../treee/treee.vue';

import {
    CollectionState,
    CollectionTree,
    CollectionIndex,
    CollectionList
} from '../../store/modules/collection/index';

const StateCL = namespace('collection', State);
const ActionCL = namespace('collection', Action);

// Register a global custom directive called `v-input-focus`
Vue.directive('input-focus', {
    // When the bound element is inserted into the DOM...
    inserted: (element: HTMLElement) => {
        // Focus the element

        console.log('input-auot=focus');

        const input = element.querySelector('input');
        if (!input) {
            return;
        }
        input.focus();
    }
});

export class CollectionBus extends Vue {
    @Emit()
    renameListStart(listId: string) {}

    @Emit()
    renameListStop(listId: string, name: string | null) {}
}

@Component({
    components: {
        FontAwesomeIcon,
        treee
    }
})
export default class CollectionView extends Vue {
    @Provide() collectionBus = new CollectionBus();

    renderer = CollectionItem;

    treeSelection = [];
    treeOnSelect(data: any) {
        console.log('treeOnSelect', data);
    }

    treeDisplay(tree: any) {
        return tree.listId;
    }

    treeDragndrop = {
        draggable: true,
        droppable: true,
        over: (target: any, event: any, inputs: any) => {
            // console.log('over', target, event, inputs);
        },
        enter: (target: any, event: any, inputs: any) => {
            console.log('enter', target, event, inputs);
        },
        leave: (target: any, event: any, inputs: any) => {
            console.log('leave', target, event, inputs);
        }
    };

    // #region vuex

    get treeItems() {
        return this.index.tree.safeJSON.items!;
    }

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

    @ActionCL setIndexTree: (options: { tree: CollectionTree }) => void;

    @ActionCL addList: (list: CollectionList) => void;

    @ActionCL renameList: (payload: { listId: string; name: string }) => void;

    @ActionCL
    selectList: (
        { listId, annex }: { listId: string; annex?: boolean }
    ) => void;

    // #endregion vuex

    isTreeDraggable: boolean = true;

    /* getListWordCount(id: string): number {
        if (this.lists.has(id)) {
            return this.lists.get(id)!.index.length;
        }

        return -1;
    } */

    draggableOptions = {
        draggable: '.el-tree-node'
    };

    treeProps = {
        label: (tree: CollectionTree) => this.getListName(tree.listId),
        children: 'items'
    };

    getListName(listId: string): string {
        if (!this.lists.has(listId)) {
            return '';
        }

        return this.lists.get(listId)!.name;
    }

    renderContent(
        h: any,
        { node, data, store }: { node: any; data: CollectionTree; store: any }
    ) {
        const list: CollectionList = this.lists.get(data.listId)!;

        if (data.listId === this.renamedListId) {
            return h('el-input', {
                attrs: {
                    // autofocus: true,
                    value: (<any>node).label
                },
                directives: [
                    {
                        name: 'input-focus'
                    }
                ],
                on: {
                    focus: (event: FocusEvent) =>
                        (<HTMLInputElement>event.target).select(),
                    blur: this.blur
                },
                nativeOn: {
                    keydown: (event: KeyboardEvent) => {
                        if (event.keyCode === 13) {
                            // enter
                            // console.log(event, data.listId);

                            this.renameList({
                                listId: data.listId,
                                name: (<HTMLInputElement>event.target).value
                            });
                            this.blur(event);
                        }

                        if (event.keyCode === 27) {
                            // escape
                            this.blur(event);
                        }
                    }
                }
            });
        }

        console.log('update collection view');

        return h(
            'span', // tag name,
            {
                class: {
                    foot: true,
                    bar: false
                },
                attrs: {
                    bl: this.selectedLists // this.selectedNodes // I'm not sure why the tree would not refresh when words are added to a list, so this seems to be the only way to force it
                }
            },
            `${(<any>node).label} [${list.id}] ${list.index.length} ${
                data.listId === this.defaultListId ? ' ✔' : ''
            }`
        );
    }

    nodeClick(node: CollectionTree, event: MouseEvent): void {
        // console.log(node, event);
        this.selectList({ listId: node.listId, annex: event.ctrlKey });
    }

    _nodeClick(data: CollectionTree, node: any, store: any) {
        const tree: Tree = this.$refs.tree as Tree;

        if (!tree) {
            return;
        }

        const selectedKeys: string[] = this.selectedLists.map(list => list.id);

        // mark corresponding nodes in the tree as selected
        tree.setCheckedKeys(
            this.ctrlPressed ? selectedKeys.concat(data.listId) : [data.listId]
        );

        console.log(tree.getCheckedKeys());
        this.selectedNodes = tree.getCheckedKeys();

        this.selectList({ listId: data.listId, annex: this.ctrlPressed });
    }

    selectedNodes: string[] = [];

    renamedListId: string = '_!';
    ctrlPressed: boolean = false;

    currentKey: string = '';

    keyDownHandler(event: KeyboardEvent): void {
        /* console.log(event, '--', (this.$refs.tree as Tree).getCurrentKey());

        const tree2: Tree = this.$refs.tree as Tree;
        if (!tree2) {
            this.currentKey = '-';
        }

        this.currentKey = tree2.getCurrentKey(); */

        // TODO: override the default tree keyboard handling

        /* const tree: Tree = this.$refs.tree as Tree;
        if (!tree) {
            console.error('Tree is not defined');
            return;
        } */

        // assume at least one list is selected
        if (event.keyCode === Vue.config.keyCodes.f2) {
            // this.renamedListId = this.selectedLists[0].id;

            event.preventDefault();
            this.isTreeDraggable = false;
            this.collectionBus.renameListStart(this.selectedLists[0].id);
        }

        // track ctrl key
        // TODO: move up to the app-level
        if (event.keyCode === Vue.config.keyCodes.ctrl) {
            this.ctrlPressed = true;
        }

        console.log(event.keyCode, 'is pressed');
    }

    keyUpHandler(event: KeyboardEvent): void {
        if (event.keyCode === Vue.config.keyCodes.ctrl) {
            this.ctrlPressed = false;
        }

        // event.preventDefault();
    }

    blur(event: KeyboardEvent): void {
        console.log('blur', event);

        this.renamedListId = '';
    }

    mounted() {
        /* console.log(
            'mounteed looking for tree',
            (this.$refs.tree as Tree).getCurrentKey()
        ); */

        this.$el.addEventListener('keydown', this.keyDownHandler);
        this.$el.addEventListener('keyup', this.keyUpHandler);

        this.collectionBus.$on('rename-list-stop', this.onRenameListStop);
    }

    onRenameListStop(listId: string, name: string | null) {
        this.isTreeDraggable = true;

        if (!name) {
            return;
        }

        this.renameList({
            listId,
            name
        });

        this.$el.focus();
    }

    createNewList(): void {
        const list = new CollectionList({ name: 'Untitled List' });
        this.addList(list);
        this.renamedListId = list.id;
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

    .highlight {
        left: 0 !important;
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
