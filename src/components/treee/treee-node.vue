<template>
    <div class="treee-node"
        :class="{ 'no-drop': isDragSource }"
        role="treeitem">

        <div class="container"
            :class="`level-${level}`"
            @click="onClick"
            @mousedown="mouseDown">

            <span class="divider before"
                :class="{ double: index === 0 }"
                @mouseover="mouseOver('before', $event)"
                @mouseout="mouseOut"></span>

            <div class="content"
                ref="content"
                @mouseover="mouseOver('middle', $event)"
                @mouseout="mouseOut">

                <span class="highlight"></span>

                <div ref="slot">
                    <slot :item="item" :level="level"></slot>
                </div>

                <!-- <component
                    class="item"
                    :class="`level-${level}`"
                    :is="renderer"
                    :item="item"></component> -->

            </div>

            <span class="divider after"
                v-if="!hasChildren"
                @mouseover="mouseOver('after', $event)"
                @mouseout="mouseOut"></span>
        </div>

        <div class="children" role="group"
            v-if="item.expanded">
            <treee-node
                v-for="(subItem, index) in item.items"
                :renderer="renderer"
                :item="subItem"
                :level="level + 1"
                :index="index"
                :key="`${index}-node`">

                <template slot-scope="{ item, level }">
                    <slot :item="item" :level="level"></slot>
                </template>
            </treee-node>
        </div>

        <!-- the very last divider - needed to move items to the top level when the last item in the top level has children -->
        <span class="divider before"
            v-if="isLast && level === 0"
            @mouseover="mouseOver('after', $event)"
            @mouseout="mouseOut"></span>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';
import { CollectionTree } from './../../store/modules/collection/index';
import Treee, { TreeDragItem, TreeDropTarget, TreeeDropPosition } from './treee.vue';

@Component
export default class TreeeNode extends Vue {
    @Prop() renderer: Vue;
    @Prop() item: CollectionTree;
    @Prop() level: number;
    @Prop() index: number;
    @Prop() isLast: boolean;

    treee: Treee;

    @Watch('item')
    onItemChange(): void {
        this.hasChildren = this.item.items.length !== 0;

        console.log('item update', this.item.listId);
    }

    isDragSource: boolean = false;

    hasChildren: boolean = false;

    /**
     * Prevent next click when starting to drag an element, so if the drag is cancelled, the element will be automatically selected.
     */
    preventNextClick: boolean = false;

    created(): void {
        // TODO: replace with inject/provide
        if (this.$parent instanceof Treee) {
            this.treee = this.$parent;
        } else if (this.$parent instanceof TreeeNode) {
            this.treee = this.$parent.treee;
        } else {
            console.error('something is wrong');
        }
    }

    mounted(): void {
        this.treee.$on('start-drag', this.onDragStart);
        this.treee.$on('stop-drag', this.onDragStop);

        console.log('parent tree', this.item.listId, this.level, this.hasChildren);
    }

    onDragStart(dragItem: TreeDragItem): void {
        if (this.item !== dragItem.item) {
            return;
        }

        this.preventNextClick = true;
        this.isDragSource = true;
    }

    onDragStop(): void {
        this.isDragSource = false;
    }

    mouseDown(event: MouseEvent): void {
        if (!this.treee.draggable) {
            return;
        }

        // prevent text from being selected when dragging
        event.preventDefault();

        const original = this.$refs.content as HTMLElement;
        const clone = original.cloneNode(true) as HTMLElement;

        // the clone is positioned absolute and the width must be set manually
        clone.style.width = `${original.clientWidth}px`;

        const dragItem: TreeDragItem = {
            event,
            node: original,
            clone,
            item: this.item
        };

        dragItem.clone.classList.add('clone');

        this.treee.$emit('init-drag', dragItem);
    }

    mouseOver(position: TreeeDropPosition, event: MouseEvent): void {
        if (!this.treee.dragItem) {
            return;
        }

        console.log(position, event.target);

        const dropTarget: TreeDropTarget = {
            node: event.currentTarget as HTMLElement,
            item: this.item,
            position: TreeeDropPosition[position]
        };

        this.treee.$emit('drag-over', dropTarget);
    }

    mouseOut(event: MouseEvent): void {
        if (!this.treee.dragItem) {
            return;
        }

        this.treee.$emit('drag-out');
    }

    onClick(event: MouseEvent): void {
        if (this.preventNextClick) {
            this.preventNextClick = false;
            return;
        }

        // set focus to the item occupying the tree node slot
        (<HTMLElement>(<HTMLElement>this.$refs.slot).firstElementChild!).focus();

        this.treee.$emit('node-click', this.item, event);
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

@mixin drag-over-highlight {
    background-color: $accent-colour !important;
}

.treee-node {
    outline: none;
}

.container {
    position: relative;
}

.content {
    position: relative;

    &.over {
        .highlight {
            display: block;
        }
    }
}

.no-drop {
    cursor: no-drop;
    color: $dark-secondary-colour;
    // outline: 1px solid grey;

    &:hover {
        background-color: transparent;
    }
}

// TODO: move highlight to the rendered item
// it should be reponsible for all the highlighting and hover/over effects, not the tree
.highlight {
    display: none;
    pointer-events: none;
    position: absolute;
    z-index: -1;
    background-color: rgba($accent-colour, 0.2);
    left: 0;
    right: 0;
    bottom: 0;
    top: 0;
}

.divider {
    // dividers are not displayed until the dragging starts
    display: none;
    position: absolute;
    left: 0;
    right: 0;
    z-index: 1;

    $divider-trigger-height: 6px;
    $divider-action-height: 2px;

    // both dividers use `:after` elements to draw the divider itself
    &.before,
    &.after {
        height: $divider-trigger-height;

        &:after {
            content: '';
            position: absolute;
            height: $divider-action-height;
            width: 100%;
            pointer-events: none;
        }
    }

    // divider `:after` elements are shifted to be drawn in the same place
    &.before {
        &:after {
            margin-top: - $divider-action-height / 2;
        }

        &.double {
            height: $divider-trigger-height * 2;
            margin-top: - $divider-trigger-height;

            &:after {
                margin-top: $divider-trigger-height - $divider-action-height / 2;
            }
        }
    }

    &.after {
        margin-top: -$divider-trigger-height;

        &:after {
            margin-top: $divider-trigger-height - $divider-action-height / 2;
        }
    }

    &.over:after {
        @include drag-over-highlight();
    }
}

$base-indent: 1rem;

@for $i from 0 through 10 {
    .divider.after,
    .divider.before {
        .level-#{$i} & {
            left: $i * $base-indent;
        }
    }

    .content {
        .level-#{$i} & {
            // padding-left: $i * $base-indent;
        }
    }
}

.clone {
    position: fixed;
    border: 1px solid grey;
    background-color: rgba(255, 255, 255, 0.9);
    z-index: 1000;
}
</style>
