<template>
    <div class="treee-node"
        role="treeitem">

        <div class="container"
            @click="click"
            @mousedown="mouseDown">

            <span class="divider before"
                ref="dividerBefore"
                @mouseover="mouseOver('before', $event)"
                @mouseout="mouseOut"></span>

            <div class="content"
                ref="content"
                @mouseover="mouseOver('middle', $event)"
                @mouseout="mouseOut">

                <!-- <span class="item">{{ item.listId }}</span> -->

                <component
                    class="item"
                    :is="renderer"
                    :item="item"></component>
            </div>

            <span class="divider after"
                ref="dividerAfter"
                v-if="item.items.length === 0"
                @mouseover="mouseOver('after', $event)"
                @mouseout="mouseOut"></span>
        </div>

        <div class="children" role="group">
            <treee-node
                v-for="(subItem, index) in item.items"
                :renderer="renderer"
                :item="subItem"
                :level="level + 1"
                :key="`${index}-node`">
            </treee-node>
        </div>

        <!-- the very last divider - needed to move items to the top level when the last item in the top level has children -->
        <span class="divider before"
            ref="dividerAfter"
            v-if="isLast && level === 0"
            @mouseover="mouseOver('after', $event)"
            @mouseout="mouseOut"></span>
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
import Treee, {
    TreeDragItem,
    TreeDropTarget,
    TreeeDropPosition
} from './treee.vue';

@Component
export default class TreeeNode extends Vue {
    @Prop() renderer: Vue;
    // @Prop() itemList: CollectionTree[];
    @Prop() item: CollectionTree;
    @Prop() level: number;
    @Prop() isLast: boolean;

    treee: Treee;

    created(): void {
        if (this.$parent instanceof Treee) {
            this.treee = this.$parent;
        } else if (this.$parent instanceof TreeeNode) {
            this.treee = this.$parent.treee;
        } else {
            console.error('something is wrong');
        }

        /* this.tree.$on('start-drag', () => (this.isDragging = true));
        this.tree.$on('stop-drag', () => (this.isDragging = false));  */

        // this.tree.$on('stop-drag', this.mouseUp);
    }

    mounted(): void {
        console.log('parent tree', this.treee);

        (<HTMLElement>this.$refs.content).style.paddingLeft = `${this.level *
            16}px`;

        (<HTMLElement>this.$refs.dividerBefore).style.paddingLeft = `${this
            .level * 16}px`;
        if (this.item.items.length === 0) {
            (<HTMLElement>this.$refs.dividerAfter).style.paddingLeft = `${this
                .level * 16}px`;
        }
    }

    mouseDown(event: MouseEvent): void {
        // this.$el.classList.add('no-drop');

        const dragItem: TreeDragItem = {
            event,
            node: this.$el,
            // clone: this.$el.cloneNode(true) as HTMLElement,
            clone: (<HTMLElement>this.$refs.content).cloneNode(
                true
            ) as HTMLElement,
            // itemList: this.itemList,
            item: this.item
        };

        dragItem.clone.classList.add('clone');

        this.treee.$emit('start-drag', dragItem);
    }

    /* mouseUp(): void {
        this.tree.$emit('stop-drag');

        // this.$el.classList.remove('no-drop');
    } */

    mouseOver(position: TreeeDropPosition, event: MouseEvent): void {
        if (!this.treee.dragItem) {
            return;
        }

        // (<HTMLElement>this.$refs.container).classList.add('over');

        const dropTarget: TreeDropTarget = {
            node: event.currentTarget as HTMLElement,
            // itemList: this.itemList,
            item: this.item,
            position: TreeeDropPosition[position]
        };

        this.treee.$emit('drag-over', dropTarget);
    }

    mouseOut(event: MouseEvent): void {
        if (!this.treee.dragItem) {
            return;
        }

        // (<HTMLElement>this.$refs.container).classList.remove('over');

        this.treee.$emit(
            'drag-out' /* , {
            node: event.currentTarget as HTMLElement
        } */
        );
    }

    click(event: MouseEvent): void {
        if (this.treee.dragItem) {
            return;
        }

        this.treee.$emit('node-click', this.item, event);
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

@mixin drag-over-highlight {
    background-color: $even-darker-secondary-colour !important;
}

/* .item {
    display: block;

    &.over {
        @include drag-over-highlight();
    }
} */

.treee-node {
    &.no-drop {
        cursor: no-drop;
    }
}

.content {
    &:hover {
        background-color: $secondary-colour;

        .no-drop & {
            background-color: transparent;
        }
    }

    &.over {
        @include drag-over-highlight();
    }
}

.nested {
    margin-left: 20px;
    position: relative;
}

//.dragging {
.divider {
    display: none;
    position: absolute;
    width: 100%;

    &.before,
    &.after {
        &:after {
            content: '';
            position: absolute;
            height: 6px;
            // left: 0;
            width: 100%;
            pointer-events: none;
        }
    }

    &.before {
        margin-bottom: -3px;
        height: 3px;

        &:after {
            margin-top: -3px;
        }
    }

    &.after {
        height: 3px;
        margin-top: -3px;

        &:after {
            margin-bottom: -3px;
        }
    }

    &.over:after {
        @include drag-over-highlight();
    }
}

.clone {
    position: fixed;
    border: 1px solid grey;
    background-color: rgba(255, 255, 255, 0.6);
}
</style>
