<template>

    <!-- TODO: use https://github.com/DominikSerafin/vuebar for scrollbar  -->

    <div class="collection-item uk-flex uk-flex-middle"
        :class="{ selected: isSelected }"
        tabindex="0"
        @mouseover="isHovered = true"
        @mouseleave="isHovered = false">

        <span class="highlight"></span>

        <template v-if="!isRenaming">

            <span
                uk-tooltip="delay: 1500; title: Default list"
                class="uk-icon uk-position-center-left item-control default active"
                v-if="isDefault">
                <octo-icon name="bookmark"></octo-icon>
            </span>

            <a
                href="#"
                uk-tooltip="delay: 1500; title: Pin"
                @click.stop.prevent="togglePinned"
                :class="{ active: list.pinned }"
                class="uk-icon item-control default"
                v-if="(isTargeted || list.pinned) && !isDefault">
                <octo-icon name="pin"></octo-icon>
            </a>

            <!-- mousedown and click listeners prevent default click handles on the Treee nodes from firing -->
            <span class="item-text">{{ list.name }}</span>
            <span
                class="item-control item-word-count uk-flex-1 uk-text-muted"
                :class="{ 'uk-invisible': list.index.length === 0}">{{ list.index.length }}</span>

            <template v-if="isTargeted">
                <a
                    href="#"
                    uk-tooltip="delay: 1500; title: View menu"
                    @click.stop.prevent="vnull"
                    class="uk-icon item-control">

                    <octo-icon name="kebab-horizontal"></octo-icon></a>

                <uk-dropdown
                    :pos="'right-center'"
                    :delay-hide="0"
                    @show="isMenuOpened = true"
                    @hide="isMenuOpened = false">

                    <ul class="uk-nav uk-dropdown-nav">

                        <li :class="{ 'uk-active': list.pinned }">
                            <a href="#" class="uk-flex uk-flex-middle"
                                @click.stop.prevent="togglePinned">

                                <span class="uk-flex-1">Pinned</span>
                                <octo-icon name="check" v-if="list.pinned"></octo-icon>
                            </a>
                        </li>

                        <li :class="{ 'uk-active': list.hidden }">
                            <a href="#" class="uk-flex uk-flex-middle"
                                @click.stop.prevent="toggleHidden">

                                <span class="uk-flex-1">Hidden</span>
                                <octo-icon name="check" v-if="list.hidden"></octo-icon>
                            </a>
                        </li>

                        <li :class="{ 'uk-active': isDefault }">
                            <a href="#" class="uk-flex uk-flex-middle"
                                @click.stop.prevent="setDefault">

                                <span class="uk-flex-1">Default</span>
                                <octo-icon name="check" v-if="isDefault"></octo-icon>
                            </a>
                        </li>

                        <li class="uk-nav-divider"></li>

                        <li><a href="#" @click.stop.prevent="vnull">Edit</a></li>
                        <li><a href="#" @click.stop.prevent="deleteList">Delete</a></li>

                    </ul>

                </uk-dropdown>

            </template>

            <a
                href="#"
                class="uk-icon item-control"
                :class="{ 'uk-invisible': item.items.length === 0}"
                @click.stop="toggleExpand">
                <octo-icon :name="`chevron-${ item.expanded ? 'up' : 'down' }`"></octo-icon>
            </a>

        </template>

        <template v-else>

             <rename-input
                v-model="newName"
                @blur.native="cancelRename(false)">
            </rename-input>

        </template>

    </div>
</template>

<script lang="ts">
import { Vue, Component, Inject, Model, Prop, Watch, Emit } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';
import { mixins } from 'vue-class-component';
// import FontAwesomeIcon from '@fortawesome/vue-fontawesome';

import { CollectionList, CollectionListMap, CollectionTree, CollectionState } from '@/store/modules/collection/index';
import UkDropdownV from './../bits/uk-dropdown.vue';
import RenameInputV from './../bits/rename-input.vue';
import RenameMixin from '@/mixins/rename-mixin';

const StateCL = namespace('collection', State);
const ActionCL = namespace('collection', Action);

// TODO: need colors for tree item highlighting
// selected
// on hover
// selected on hover

// TODO: need to decide what to do with the list icons; how to colour them; how to make sure colours don't interfere with higlighting colours'

@Component({
    components: {
        // FontAwesomeIcon,
        'uk-dropdown': UkDropdownV,
        'rename-input': RenameInputV
    },
    directives: {
        // Register a local custom directive called `v-input-focus`
        'input-focus': {
            // When the bound element is inserted into the DOM...
            inserted: (element: HTMLElement) => {
                // Focus the element

                const input = element.querySelector('input');
                if (!input) {
                    return;
                }
                input.focus();
            }
        }
    }
})
export default class CollectionItemV extends mixins(RenameMixin) {
    @Emit('default')
    emDefault(payload: { listId: string }) {}

    @Emit('pinned')
    emPinned(payload: { listId: string; value: boolean }) {}

    @Emit('hidden')
    emHidden(payload: { listId: string; value: boolean }) {}

    @Emit('expanded')
    emExpanded(payload: { listId: string; value: boolean }) {}

    @Emit('delete')
    emDelete(payload: { listId: string }) {}

    // passed in CollectionTree object
    @Prop() item: CollectionTree;

    // id of the newly created, mint list; trigger auto-renaming
    @Prop() mintListId: string;

    // an array of selected lists
    @StateCL selectedLists: CollectionList[];

    // a object map of all lists available
    @StateCL lists: CollectionListMap;

    // the id of the default list
    @StateCL((state: CollectionState) => state.index.defaultListId)
    defaultListId: string;

    // used by the rename mixin
    get id(): string {
        return this.list.id;
    }

    // used by the rename mixin
    getCurrentName(): string {
        return this.list.name;
    }

    /**
     * The CollectionList object of the current CollectionTree object
     */
    get list(): CollectionList {
        return this.lists[this.item.listId]!;
    }

    /**
     * The flag indicating if this list is one of the selected lists.
     */
    get isSelected(): boolean {
        return this.selectedLists.some(selectedList => this.list.id === selectedList.id);
    }

    /**
     * The flag indicating if this list is the default list in the collection.
     */
    get isDefault(): boolean {
        return this.item.listId === this.defaultListId;
    }

    isHovered: boolean = false;
    isMenuOpened: boolean = false;
    get isTargeted(): boolean {
        return this.isHovered || this.isMenuOpened;
    }

    mounted(): void {
        // start the rename process for a newly created list
        if (this.list.id === this.mintListId) {
            this.startRename();
        }
    }

    setDefault(): void {
        this.emDefault({ listId: this.list.id });
    }

    togglePinned(): void {
        this.emPinned({ listId: this.list.id, value: !this.list.pinned });
    }

    toggleHidden(): void {
        this.emHidden({ listId: this.list.id, value: !this.list.hidden });
    }

    toggleExpand(): void {
        this.emExpanded({ listId: this.list.id, value: !this.item.expanded });
    }

    deleteList(): void {
        this.emDelete({ listId: this.list.id });
    }

    vnull(): void {}
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.collection-item {
    position: relative;

    height: 30px;
    font-size: 0.8rem;

    outline: none;

    &.checked {
        background-color: darken($secondary-colour, 10%);
    }

    &.hover {
        background-color: $secondary-colour;
    }
}

.item-text {
    line-height: 30px;
    margin-left: calc(0.5rem + 30px);
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    user-select: none;
    pointer-events: none;

    .selected & {
        font-weight: 500;
    }
}

.item-word-count {
    line-height: 30px;
}

.item-control {
    padding: 0 0.5rem;

    &.default {
        position: absolute;
        left: 4px;
    }

    &.active {
        color: $accent-colour;
    }
}

.uk-nav a.uk-flex {
    display: flex !important;
}

$base-indent: 1rem;

@for $i from 0 through 10 {
    .item-text {
        .level-#{$i} & {
            padding-left: $i * $base-indent;
        }
    }

    .rename-input {
        .level-#{$i} & {
            margin-left: calc(0.5rem + 30px - 10px + #{$i} * #{$base-indent});
        }
    }
}

.collection-item {
    &.selected .highlight {
        background-color: rgba($color: $accent-colour, $alpha: 0.1);
        // border-left: 2px solid $accent-colour;
    }

    &:hover .highlight {
        background-color: $secondary-colour;
    }

    &:focus .highlight {
        background-color: rgba($color: $accent-colour, $alpha: 0.2);
    }

    &:focus:not(.selected) .highlight {
        background-color: rgba($color: $accent-colour, $alpha: 0.05);
    }

    .highlight {
        content: '';
        position: absolute;
        height: 100%;
        left: 0;
        right: 0;
        z-index: -1;

        &.selected {
            background-color: darken($secondary-colour, 10%);
        }

        &:hover {
            background-color: $secondary-colour;
        }
    }
}

.highlight {
    pointer-events: none;
    position: absolute;
    z-index: -1;
    left: 0;
    right: 0;
    bottom: 0;
    top: 0;
}

/* .icon-button {
    color: $dark-secondary-colour;
    font-size: 0.8rem;
    cursor: pointer;
    width: 1.5rem;
    height: 1.5rem;
}

.hidden-button {
    opacity: 0;

    &.selected {
        color: $primary-colour;
        opacity: 1;
    }

    &:hover {
        color: $accent-colour;
    }
}

// position pin/default flags on the left
.default-flag,
.pin-flag {
    position: absolute;
    left: 0;
}

.default-flag {
    color: $primary-colour;
    display: flex;
    align-items: center;
    justify-content: center;

    cursor: default !important;
}

.pin-flag {
} */

.rename-input {
    font-size: 0.8rem;
    height: 1.5rem;
}

// adjust visual center
/* .pin-flag {
    svg {
        position: relative;
        top: 2px;
    }
} */
</style>
