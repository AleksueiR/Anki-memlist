<template>
    <div class="treee-root" role="tree"
        :class="{ dragging: dragItem }"
        @mouseup="stopDrag()"
        @mousemove="moveDrag"
        @mouseleave="stopDrag(true)">

        <!--  -->

        <treee-node
            v-for="(item, index) in items"
            :renderer="renderer"
            :item="item"
            :level="0"
            :isLast="index === items.length - 1"
            :key="`${index}-node`">
        </treee-node>

    </div>
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
import deepmerge from 'deepmerge';

import { CollectionTree } from './../../store/modules/collection/index';
import TreeeNode from './treee-node.vue';

/* export class TreeeStore extends Vue {
    isDragging: boolean = false;

    treeTrunk: Treee;
} */

export enum TreeeDropPosition {
    before = 'before',
    after = 'after',
    middle = 'middle'
}

/* export class TreeeDragOverEvent {
    node: HTMLElement;
    itemList: any[];
    item: any;
    position: TreeeDropPosition;
} */

export interface TreeDragItem {
    event: MouseEvent;
    node: HTMLElement; // tree-node element
    clone: HTMLElement;
    item: any;
}

export interface TreeDropTarget {
    node: HTMLElement;
    item: any;
    position: TreeeDropPosition;
}

@Component({
    components: {
        TreeeNode
    }
})
export default class Treee extends Vue {
    @Prop({ default: 'listId' })
    keyProp: string;

    @Prop({ default: 'items' })
    itemsProp: string;

    items: object[] = [];

    @Prop() value: object[];

    @Watch('value')
    onValueChanged() {
        this.items = deepmerge({}, { items: this.value }).items;
        this.stopDrag(true);
    }

    @Prop() renderer: Vue;

    /* drag: {
        node: HTMLElement; // this is a clone
        itemList: any[];
        item: any;
    } | null = null;

    target: TreeeDragOverEvent | null = null; */

    /* treeVm: TreeeStore = new TreeeStore(); */

    dragItem: TreeDragItem | null = null;
    dropTarget: TreeDropTarget | null = null;

    get root() {
        const element: HTMLElement = document.querySelector(
            '.treee-root'
        ) as HTMLElement;

        return element;
    }

    mounted(): void {
        this.$on('start-drag', this.startDrag);
        // this.treeVm.$on('stop-drag', this.stopDrag);
        this.$on('drag-over', this.dragOver);
        this.$on('drag-out', this.dragOut);

        /* this.$on('node-click', (...args: any[]) =>
            this.$emit('node-click', ...args)
        ); */
    }

    /* mouseOut(event: MouseEvent): void {
        if (!this.treeVm.isDragging) {
            return;
        }

        console.log(event.target, event.currentTarget);

        if (event.target === this.$el) {
            this.stopDrag();
        }
    } */

    startDrag(dragItem: TreeDragItem): void {
        this.dragItem = dragItem;
        this.dragItem.node.classList.add('no-drop');
        this.root.appendChild(this.dragItem.clone);
        this.moveDrag(this.dragItem.event);
    }

    stopDrag(cancelDrop: boolean = false): void {
        if (!this.dragItem) {
            return;
        }

        if (this.dropTarget) {
            if (!cancelDrop) {
                this.performDrop();
            }

            this.dragOut();
        }

        this.dragItem.node.classList.remove('no-drop');
        this.root.removeChild(this.dragItem.clone);
        this.dragItem = null;
    }

    moveDrag(event: MouseEvent): void {
        if (!this.dragItem) {
            return;
        }

        this.dragItem.clone.style.top = `${event.pageY - 10}px`;
        this.dragItem.clone.style.left = `${event.pageX + 10}px`;
    }

    dragOver(dropTarget: TreeDropTarget): void {
        if (!this.dragItem) {
            return;
        }

        // prevent items being dropped onto their children
        if (this.contains(dropTarget.item, this.dragItem.item)) {
            return;
        }

        /* // prevent items from being dropped onto themselves
        if (
            event.item[this.keyProp] === this.drag!.item[this.keyProp] &&
            event.position === TreeeDropPosition.middle
        ) {
            // event.node.classList.add('no-drop');
            return;
        } */

        this.dropTarget = dropTarget;
        this.dropTarget.node.classList.add('over');
    }

    dragOut(): void {
        if (!this.dragItem || !this.dropTarget) {
            return;
        }

        this.dropTarget.node.classList.remove('over');
        this.dropTarget = null;
    }

    performDrop(): void {
        if (!this.dragItem || !this.dropTarget) {
            return;
        }

        console.log('drop');

        const {
            list: dragItemParentList,
            index: dragItemIndex
        } = this.findItemPosition(this.dragItem.item);

        // remove dragged item from its parent list
        /* const dragItemIndex = this.drag.itemList.findIndex(
            item => item[this.keyProp] === this.drag!.item[this.keyProp]
        ); */
        //this.drag.itemList.splice(dragItemIndex, 1);
        dragItemParentList.splice(dragItemIndex, 1);

        const {
            list: targetItemParentList,
            index: targetItemIndex
        } = this.findItemPosition(this.dropTarget.item);

        /* const targetItemIndex = this.target.itemList.findIndex(
            item => item[this.keyProp] === this.target!.item[this.keyProp]
        ); */

        switch (this.dropTarget.position) {
            case TreeeDropPosition.before:
                targetItemParentList.splice(
                    targetItemIndex,
                    0,
                    this.dragItem.item
                );

                break;

            case TreeeDropPosition.middle:
                this.dropTarget.item.items.push(this.dragItem.item);

                break;

            case TreeeDropPosition.after:
                targetItemParentList.splice(
                    targetItemIndex + 1,
                    0,
                    this.dragItem.item
                );
                break;
        }

        this.$emit('input', this.items);
    }

    findItemPosition(item: any): { list: any[]; index: number } {
        const stack: any[] = [];
        let answer: { list: any[]; index: number } = { list: [], index: -1 };

        stack.push({ items: this.items });

        while (stack.length !== 0) {
            const node = stack.pop();

            const index = node.items.findIndex(
                (nodeItem: any) => nodeItem[this.keyProp] === item[this.keyProp]
            );
            if (index !== -1) {
                answer = { list: node.items, index };
                break;
            }

            if (node.items.length !== 0) {
                stack.push.apply(stack, node.items.slice());
            }
        }

        return answer;

        /* const index = treeItems.findIndex((treeItem: any) => treeItem[this.keyProp] === item[this.keyProp]);

        if (index !== -1) {
            return {
                parentList: treeItems,
                index
            }
        }



        treeItems.map((treeItem: any) => this.findItemPosition(item, treeItem.items as any[])) */
    }

    contains(item: any, parent: any): boolean {
        if (item[this.keyProp] === parent[this.keyProp]) {
            return true;
        }

        if (parent.items.length === 0) {
            return false;
        }

        return (<any[]>parent.items).find(subItem =>
            this.contains(item, subItem)
        );
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.treee-root {
    cursor: default;
    user-select: none;
    position: relative;

    &.dragging /deep/ {
        .divider {
            display: block;
        }
    }
}
</style>
