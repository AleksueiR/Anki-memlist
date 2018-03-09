<template>
    <div class="collection-item uk-flex uk-flex-middle"
        :class="{ selected: isSelected }"
        @mouseover="isHovered = true"
        @mouseleave="isHovered = false">

        <span class="highlight"></span>

        <!--     transform: scale(0.7); -->

        <!-- <mdi-comment-alert-icon style="transform: scale(0.7);" /> -->


        <!-- uk-icon="ratio: 0.7; icon: bookmark" -->

        <span
            uk-tooltip="delay: 1500; title: Default list"
            class="uk-icon uk-position-center-left item-control default active"
            v-if="isDefault">
            <font-awesome-icon icon="bookmark" />
        </span>

        <!-- uk-icon="ratio: 0.7; icon: hashtag" -->

        <a
            href="#"
            uk-tooltip="delay: 1500; title: Pin"
            @click.stop="togglePinned"
            :class="{ active: list.pinned }"
            class="uk-margin-small-right uk-icon item-control default"
            v-if="(isTargeted || list.pinned) && !isDefault">
            <font-awesome-icon :icon="['fas', 'thumbtack']" />
            <!-- <mdi-pin-icon style="transform: scale(0.7);" /> -->
        </a>

        <template v-if="!isRenaming">
            <!-- mousedown and click listeners prevent default click handles on the Treee nodes from firing -->
            <span class="item-text uk-flex-1">{{ list.name }}</span>

            <template v-if="isTargeted">
                <a
                    href="#"
                    uk-tooltip="delay: 1500; title: View menu"
                    uk-icon="ratio: 0.7; icon: more"
                    @click.stop="vnull"
                    class="uk-margin-small-left uk-icon item-control"></a>
                <uk-dropdown
                    :pos="'right-center'"
                    :delay-hide="0"
                    @show="isMenuOpened = true"
                    @hide="isMenuOpened = false">

                    <ul class="uk-nav uk-dropdown-nav">

                        <li :class="{ 'uk-active': list.pinned }">
                            <a href="#" class="uk-flex uk-flex-middle"
                                @click.stop="togglePinned">

                                <span class="uk-flex-1">Pinned</span>
                                <span uk-icon="icon: check" v-if="list.pinned"></span>
                            </a>
                        </li>

                        <li :class="{ 'uk-active': list.hidden }">
                            <a href="#" class="uk-flex uk-flex-middle"
                                @click.stop="toggleHidden">

                                <span class="uk-flex-1">Hidden</span>
                                <span uk-icon="icon: check" v-if="list.hidden"></span>
                            </a>
                        </li>

                        <li :class="{ 'uk-active': isDefault }">
                            <a href="#" class="uk-flex uk-flex-middle"
                                @click.stop="setDefault">

                                <span class="uk-flex-1">Default</span>
                                <span uk-icon="icon: check" v-if="isDefault"></span>
                            </a>
                        </li>

                        <li class="uk-nav-divider"></li>

                        <li><a href="#">Edit</a></li>
                        <li><a href="#" @click.stop="deleteList">Delete</a></li>

                    </ul>

                </uk-dropdown>

            </template>

            <span
                v-else
                class="item-control item-word-count uk-text-muted">{{ list.index.length }}</span>

            <!-- :uk-icon="`ratio: 0.7; icon: chevron-${ item.expanded ? 'up' : 'down' }`" -->

            <a
                href="#"
                class="uk-icon item-control uk-margin-small-right"
                :uk-icon="`ratio: 0.7; icon: chevron-${ item.expanded ? 'up' : 'down' }`"
                v-if="item.items.length > 0"
                @click.stop="toggleExpand">
                <!-- <font-awesome-icon :icon="['far', 'angle-up']" /> -->
            </a>

            <span
                uk-icon="ratio: 0.7; icon: chevron-up"
                class="uk-icon item-control uk-margin-small-right uk-invisible"
                v-else></span>

        </template>

        <template v-else>
            <el-input
                class="name-input"
                v-input-focus
                v-model="newName"

                @focus.once="onFocus"
                @blur="renameCancel"

                @mousedown.native.stop="() => {}"
                @click.native.stop="() => {}"

                @keyup.native.enter="renameComplete"
                @keyup.native.esc="renameCancel"></el-input>
        </template>


    </div>
</template>

<script lang="ts">
import { Vue, Component, Inject, Model, Prop, Watch, Emit } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';
import FontAwesomeIcon from '@fortawesome/vue-fontawesome';

import {
    CollectionList,
    CollectionListMap,
    CollectionTree,
    CollectionState
} from '../../store/modules/collection/index';
import CollectionBus from './collection-bus';
import UkDropdownV from '../bits/uk-dropdown.vue';

const StateCL = namespace('collection', State);
const ActionCL = namespace('collection', Action);

// TODO: need colors for tree item highlighting
// selected
// on hover
// selected on hover

// TODO: need to decide what to do with the list icons; how to colour them; how to make sure colours don't interfere with higlighting colours'

@Component({
    components: {
        FontAwesomeIcon,
        'uk-dropdown': UkDropdownV
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
export default class CollectionItemV extends Vue {
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

    // communication with collection view
    @Inject() bus: CollectionBus;

    // passed in CollectionTree object
    @Prop() item: CollectionTree;

    // an array of selected lists
    @StateCL selectedLists: CollectionList[];

    // a object map of all lists available
    @StateCL lists: CollectionListMap;

    // the id of the default list
    @StateCL((state: CollectionState) => state.index.defaultListId)
    defaultListId: string;

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

    // #region renaming

    isRenaming: boolean = false;
    newName: string | null = null;

    mounted(): void {
        this.bus.$on('rename-start', this.renameStart);

        // TODO: what is this???
        this.bus.mountComplete(this.list.id);
    }

    renameStart(listId: string): void {
        console.log('rename start', this.item.listId, listId);
        if (this.item.listId !== listId) {
            return;
        }

        this.isRenaming = true;
        this.newName = this.list.name;
    }

    renameComplete(): void {
        this.isRenaming = false;
        this.bus.renameComplete(this.item.listId, this.newName);
    }

    renameCancel() {
        this.isRenaming = false;
        this.bus.renameCancel(this.item.listId);
    }

    // #endregion renaming

    /**
     * Preselect the current list name on focus.
     */
    onFocus(event: FocusEvent): void {
        (<HTMLInputElement>event.target).select();
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

    &.checked {
        background-color: darken($secondary-colour, 10%);
    }

    &.hover {
        background-color: $secondary-colour;
    }
}

.item-text {
    margin-left: calc(0.5rem + 30px);
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    user-select: none;
    pointer-events: none;
    font-size: 0.8rem;
}

.item-word-count {
    font-size: 0.8rem;
}

.item-control {
    padding: 0.5rem;

    &.default {
        position: absolute;
        left: 6px;
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
    .item-text,
    .name-input {
        .level-#{$i} & {
            padding-left: $i * $base-indent;
        }
    }
}

////////

// TODO: move this inot common styles
/* .icon-button {
    color: $even-darker-secondary-colour;
    border: none;
    background: transparent;
    padding: 0;
    margin: 0;
} */

.collection-item {
    // margin: 0 0.5rem 0 0.5rem;

    // margin-left: 1.5rem;

    span {
        // line-height: 1.5rem;
    }

    &.selected,
    &:hover {
        .hidden-button {
            opacity: 1;
        }
    }

    &.selected .highlight {
        background-color: rgba($color: $accent-colour, $alpha: 0.1);
        border-left: 4px solid $accent-colour;
    }

    &:hover .highlight {
        background-color: $secondary-colour;
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

.name-input /deep/ {
    font-size: 1rem;
    margin-left: calc(0.5rem + 30px);

    input {
        font-family: Segoe UI;
        height: 1.5rem;
        border-radius: 0;
    }
}

// adjust visual center
/* .pin-flag {
    svg {
        position: relative;
        top: 2px;
    }
} */

.uk-margin-small-right {
    // margin-right: 0.5rem !important;
    margin-right: 2px !important;
}
.uk-margin-small-left {
    // margin-left: 0.5rem !important;
    margin-left: 2px !important;
}
</style>
