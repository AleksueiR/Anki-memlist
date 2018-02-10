<template>
    <div class="treee-node"
        role="treeitem">

        <div class="container"
            @mousedown="mouseDown"
            @mouseup="mouseUp">

            <span class="divider before"
                @mouseover="mouseOver('before', $event)"
                @mouseout="mouseOut"></span>

            <div class="content"
                @mouseover="mouseOver('middle', $event)"
                @mouseout="mouseOut">
                <span class="item">{{ item.listId }}</span>
            </div>

            <span class="divider after"
                v-if="item.items.length === 0"
                @mouseover="mouseOver('after', $event)"
                @mouseout="mouseOut"></span>
        </div>

        <div class="children nested" role="group">
            <treee-node
                v-for="(subItem, index) in item.items"
                :itemList="item.items"
                :item="subItem"
                :tree="tree"
                :key="`${index}-node`">
            </treee-node>
        </div>
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
import { CollectionTree } from './../../store/modules/collection/index';
import Treee, { TreeeStore } from './treee.vue';

@Component
export default class TreeeNode extends Vue {
    @Prop() itemList: CollectionTree[];
    @Prop() item: CollectionTree;
    @Prop() tree: TreeeStore;

    get itemIndex(): number {
        return this.itemList.findIndex(item => item.listId === item.listId);
    }

    isDragging: boolean = false;

    mounted(): void {
        console.log('parent tree', this.tree);

        /* this.tree.$on('start-drag', () => (this.isDragging = true));
        this.tree.$on('stop-drag', () => (this.isDragging = false));  */
    }

    mouseDown(): void {
        this.tree.$emit('start-drag', {
            node: this.$el.cloneNode(true) as HTMLElement,
            itemList: this.itemList,
            item: this.item
        });
    }

    mouseUp(): void {
        this.tree.$emit('stop-drag');
    }

    mouseOver(position: string, event: MouseEvent): void {
        if (!this.tree.isDragging) {
            return;
        }

        this.tree.$emit('drag-over', {
            node: event.target as HTMLElement,
            itemList: this.itemList,
            item: this.item,
            position
        });
    }

    mouseOut(event: MouseEvent): void {
        if (!this.tree.isDragging) {
            return;
        }

        this.tree.$emit('drag-out', {
            node: event.target as HTMLElement
        });
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.item {
    display: block;

    &.over {
        background-color: $even-darker-secondary-colour;
    }
}

.nested {
    margin-left: 20px;
    position: relative;
}

//.dragging {
.divider {
    display: block;
    position: absolute;
    width: 100%;

    &.before {
        margin-bottom: -3px;
        height: 3px;

        &:after {
            content: '';
            position: absolute;
            height: 6px;
            width: 100%;
            margin-top: -3px;
            pointer-events: none;
        }
    }

    &.after {
        height: 3px;
        margin-top: -3px;

        &:after {
            content: '';
            position: absolute;
            height: 6px;
            width: 100%;
            margin-bottom: -3px;
            pointer-events: none;
        }
    }

    &.over:after {
        background-color: $even-darker-secondary-colour;
    }
}

.clone {
    position: fixed;
}
</style>
