<template>
    <div class="treee-root" role="tree"
        :class="{ dragging: dragItem }">

        <treee-node
            v-for="(item, index) in items"
            :renderer="renderer"
            :item="item"
            :level="0"
            :index="index"
            :isLast="index === items.length - 1"
            :key="`${index}-node`">

            <template slot-scope="{ item, level }">
                <slot :item="item" :level="level"></slot>
            </template>

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

export enum TreeeDropPosition {
    before = 'before',
    after = 'after',
    middle = 'middle'
}

export interface TreeDragItem {
    event: MouseEvent;
    node: HTMLElement; // content tree-node element
    clone: HTMLElement; // the clone of the content tree-node
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
        this.dropTarget = null;
        this.stopDrag();
    }

    @Prop() renderer: Vue;

    @Prop() draggable: boolean;

    dragOrigin: TreeDragItem | null = null;
    dragItem: TreeDragItem | null = null;
    dropTarget: TreeDropTarget | null = null;

    get root() {
        const element: HTMLElement = document.querySelector(
            '.treee-root'
        ) as HTMLElement;

        return element;
    }

    mounted(): void {
        this.$on('init-drag', this.initDrag);
        this.$on('drag-over', this.dragOver);
        this.$on('drag-out', this.dragOut);
    }

    initDrag(dragItem: TreeDragItem): void {
        this.dragOrigin = dragItem;

        document.addEventListener('mousemove', this.startDetection);
        document.addEventListener('mouseup', this.stopDetection);
    }

    startDetection(event: MouseEvent): void {
        if (!this.dragOrigin) {
            return;
        }

        const [x, y] = [
            this.dragOrigin.event.pageX - event.pageX,
            this.dragOrigin.event.pageY - event.pageY
        ];
        const c = Math.sqrt(x * x + y * y);

        // if move of 3 pixels detected, start drag
        if (c > 3) {
            this.stopDetection();
            this.startDrag(this.dragOrigin);
        }
    }

    stopDetection(): void {
        document.removeEventListener('mousemove', this.startDetection);
        document.removeEventListener('mouseup', this.stopDetection);
    }

    startDrag(dragItem: TreeDragItem): void {
        document.addEventListener('mouseup', this.stopDrag);
        document.addEventListener('mousemove', this.moveDrag);

        this.dragItem = dragItem;
        // this.dragItem.node.classList.add('no-drop');
        this.root.appendChild(this.dragItem.clone);

        this.$emit('start-drag', this.dragItem);

        this.moveDrag(this.dragItem.event);
    }

    stopDrag(): void {
        document.removeEventListener('mouseup', this.stopDrag);
        document.removeEventListener('mousemove', this.moveDrag);

        this.dragOrigin = null;

        if (!this.dragItem) {
            return;
        }

        if (this.dropTarget) {
            this.performDrop();
            this.dragOut();
        }

        // this.dragItem.node.classList.remove('no-drop');
        this.root.removeChild(this.dragItem.clone);
        this.dragItem = null;

        this.$emit('stop-drag');
    }

    moveDrag(event: MouseEvent): void {
        if (!this.dragItem) {
            return;
        }

        this.dragItem.clone.style.top = `${event.pageY -
            this.dragItem.clone.clientHeight / 2}px`;
        this.dragItem.clone.style.left = `${event.pageX + 10}px`;
    }

    dragOver(dropTarget: TreeDropTarget): void {
        if (!this.dragItem) {
            return;
        }

        // prevent items being dropped their children
        if (this.contains(dropTarget.item, this.dragItem.item)) {
            return;
        }

        // prevent items being dropped onto themselves
        // dropping an item before or after itself is okay
        if (
            this.dragItem.item === dropTarget.item &&
            dropTarget.position === TreeeDropPosition.middle
        ) {
            return;
        }

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

        // at item being dropped before or after itself
        // the order will not change
        if (this.dragItem.item === this.dropTarget.item) {
            return;
        }

        const {
            list: dragItemParentList,
            index: dragItemIndex
        } = this.findItemPosition(this.dragItem.item);

        // remove dragged item from its parent list
        dragItemParentList.splice(dragItemIndex, 1);

        const {
            list: targetItemParentList,
            index: targetItemIndex
        } = this.findItemPosition(this.dropTarget.item);

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
    }

    contains(item: any, parent: any): boolean {
        /* if (item[this.keyProp] === parent[this.keyProp]) {
            return true;
        } */

        if (parent.items.length === 0) {
            return false;
        }

        return (<any[]>parent.items).find(
            subItem =>
                item[this.keyProp] === subItem[this.keyProp] ||
                this.contains(item, subItem)
        );
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.treee-root {
    cursor: default;
    // user-select: none;
    position: relative;

    &.dragging /deep/ {
        .divider {
            display: block;
        }
    }
}
</style>
