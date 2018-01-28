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

            <el-tree
                :data="index.tree.items"
                :expand-on-click-node="false"
                :props="treeProps"
                node-key="listId"
                :show-checkbox="false"
                :check-strictly="true"
                :render-content="renderContent"
                @node-click="nodeClick"
                ref="tree"></el-tree>

            selected Nodes: {{ selectedNodes }}
            renameListId: {{ renameListId}}
        </div>


    </section>
</template>

<script lang="ts">
import {
    Vue,
    Component,
    Inject,
    Model,
    Prop,
    Watch
} from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';

import FontAwesomeIcon from '@fortawesome/vue-fontawesome';
import { Tree } from 'element-ui/types';

import {
    CollectionState,
    CollectionTree,
    CollectionIndex,
    CollectionList
} from '../../store/modules/collection/index';
import { longStackTraces } from 'bluebird';

const StateCL = namespace('collection', State);
const ActionCL = namespace('collection', Action);

// Register a global custom directive called `v-focus`
Vue.directive('input-focus', {
    // When the bound element is inserted into the DOM...
    inserted: (element: HTMLElement) => {
        // Focus the element

        const input = element.querySelector('input');
        if (!input) {
            return;
        }
        input.focus();
    }
});

@Component({
    components: {
        FontAwesomeIcon
    }
})
export default class CollectionView extends Vue {
    // #region vuex

    @StateCL('index') index: CollectionIndex;
    @StateCL('lists') lists: Map<string, CollectionList>;
    @StateCL((state: CollectionState) => state.index.defaultListId)
    defaultListId: string;

    @ActionCL('addList') addList: (list: CollectionList) => void;

    @ActionCL('editListName')
    editListName: (payload: { listId: string; name: string }) => void;

    // #endregion vuex

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
        // console.log(h, node, data, store);

        let a: Tree;

        const list: CollectionList = this.lists.get(data.listId)!;

        if (data.listId === this.renameListId) {
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

                            this.editListName({
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

        return h(
            'span', // tag name,
            {
                class: {
                    foot: true,
                    bar: false
                }
            },
            [
                (<any>node).label,
                ` [${list.id}] `,
                list.words.length,
                data.listId === this.defaultListId ? ' ✔' : ''
            ]
        );
    }

    nodeClick(data: CollectionTree, node: any, store: any) {
        const tree: Tree = this.$refs.tree as Tree;

        console.log(store, node, tree);

        tree.setCheckedKeys(
            //this.selectedNodes.concat([data.listId])
            [data.listId]
        );

        console.log(tree.getCheckedKeys());

        this.selectedNodes = tree.getCheckedKeys();
    }

    selectedNodes: string[] = [];

    renameListId: string = '_!';

    renameList(event: KeyboardEvent): void {
        if (event.keyCode !== 113) {
            return;
        }

        event.preventDefault();

        const tree: Tree = this.$refs.tree as Tree;

        this.renameListId = tree.getCurrentKey();
        console.log(event);
    }

    blur(event: KeyboardEvent): void {
        console.log('blur', event);

        this.renameListId = '';
    }

    mounted() {
        this.$el.addEventListener('keydown', this.renameList);
    }

    createNewList(): void {
        const list = new CollectionList({ name: 'Untitled List' });
        this.addList(list);
        this.renameListId = list.id;
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

// move caret icon to the right
/deep/ .el-tree-node__expand-icon {
    order: 1;
    transform: rotate(90deg);

    &.expanded {
        transform: rotate(-90deg);
    }
}

///
/deep/ .foot {
    flex: 1;
}
</style>
