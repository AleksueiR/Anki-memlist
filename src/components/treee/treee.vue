<template>
    <div class="treee-root" role="tree"
        :class="{ dragging: treeVm.isDragging }"
        @mousemove="moveDrag">

        <!-- @mouseleave="stopDrag" -->

        <treee-node
            v-for="(item, index) in items"
            :itemList="items"
            :item="item"
            :tree="treeVm"
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

export class TreeeStore extends Vue {
    isDragging: boolean = false;
}

export enum TreeeDropPosition {
    before = 'before',
    after = 'after',
    middle = 'middle'
}

export class TreeeDragOverEvent {
    node: HTMLElement;
    itemList: any[];
    item: any;
    position: TreeeDropPosition;
}

@Component({
    components: {
        TreeeNode
    }
})
export default class Treee extends Vue {
    @Prop() value: object[];
    //@Prop() keyName: string;
    keyProp: string = 'listId';
    itemsProp: string = 'items';

    items: object[] = [];

    @Watch('value')
    onValueChanged() {
        this.items = deepmerge({}, { items: this.value }).items;
        this.stopDrag(true);
    }

    drag: {
        node: HTMLElement; // this is a clone
        itemList: any[];
        item: any;
    } | null = null;

    target: TreeeDragOverEvent | null = null;

    treeVm: TreeeStore = new TreeeStore();

    get root() {
        const element: HTMLElement = document.querySelector(
            '.treee-root'
        ) as HTMLElement;

        return element;
    }

    mounted(): void {
        this.treeVm.$on('start-drag', this.startDrag);
        this.treeVm.$on('stop-drag', this.stopDrag);
        this.treeVm.$on('drag-over', this.dragOver);
        this.treeVm.$on('drag-out', this.dragOut);
    }

    mouseOut(event: MouseEvent): void {
        if (!this.treeVm.isDragging) {
            return;
        }

        console.log(event.target, event.currentTarget);

        if (event.target === this.$el) {
            this.stopDrag();
        }
    }

    startDrag(event: { node: HTMLElement; itemList: any[]; item: any }): void {
        if (this.treeVm.isDragging) {
            return;
        }

        this.drag = event;

        this.root.appendChild(this.drag.node);
        this.drag.node.classList.add('clone');

        this.treeVm.isDragging = true;
    }

    stopDrag(cancelDrop: boolean = false): void {
        if (!this.treeVm.isDragging) {
            return;
        }

        if (this.target) {
            if (!cancelDrop) {
                this.performDrop();
            }

            this.dragOut({ node: this.target.node });
        }

        if (this.drag) {
            this.root.removeChild(this.drag.node);
            this.drag = null;
        }

        this.treeVm.isDragging = false;
    }

    moveDrag(event: MouseEvent): void {
        if (!this.treeVm.isDragging) {
            return;
        }

        this.drag!.node.style.top = `${event.pageY + 10}px`;
        this.drag!.node.style.left = `${event.pageX + 10}px`;
    }

    dragOver(event: TreeeDragOverEvent): void {
        if (!this.treeVm.isDragging) {
            return;
        }

        // prevent items being dropped onto their children
        if (this.contains(event.item, this.drag!.item)) {
            return;
        }

        // prevent items from being dropped onto themselves
        if (
            event.item[this.keyProp] === this.drag!.item[this.keyProp] &&
            event.position === TreeeDropPosition.middle
        ) {
            return;
        }

        this.target = event;

        this.target.node.classList.add('over');
    }

    dragOut(event: { node: HTMLElement }): void {
        if (!this.treeVm.isDragging) {
            return;
        }

        event.node.classList.remove('over');
        this.target = null;
    }

    performDrop(): void {
        if (!this.target || !this.drag) {
            return;
        }

        // remove dragged item from its parent list
        const dragItemIndex = this.drag.itemList.findIndex(
            item => item[this.keyProp] === this.drag!.item[this.keyProp]
        );
        this.drag.itemList.splice(dragItemIndex, 1);

        const targetItemIndex = this.target.itemList.findIndex(
            item => item[this.keyProp] === this.target!.item[this.keyProp]
        );

        switch (this.target.position) {
            case TreeeDropPosition.before:
                this.target.itemList.splice(targetItemIndex, 0, this.drag.item);

                break;

            case TreeeDropPosition.middle:
                this.target.item.items.push(this.drag.item);

                break;

            case TreeeDropPosition.after:
                this.target.itemList.splice(
                    targetItemIndex + 1,
                    0,
                    this.drag.item
                );
                break;
        }

        this.$emit('input', this.items);
    }

    contains(item: any, parent: any): boolean {
        if (parent.items.length === 0) {
            return false;
        }

        return (<any[]>parent.items).find(
            subItem =>
                subItem[this.keyProp] === item[this.keyProp] ||
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
}
</style>
