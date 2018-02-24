<template>
    <div class="collection-item"
        :class="{ selected: isSelected }">

        <span class="highlight"></span>

        <span
            class="icon-button default-flag"
            v-if="item.listId === defaultListId">
            <font-awesome-icon icon="bookmark" />
        </span>

        <button
            class="icon-button hidden-button pin-flag"
            :class="{ selected: list.pin }"
            @click.stop="onPinClick"
            v-if="item.listId !== defaultListId">
            <font-awesome-icon icon="thumbtack" />
        </button>

        <span v-if="!isRenaming">{{ list.name }} {{ list.index.length }}</span>

        <!-- mousedown and click listeners prevent default click handles on the Treee nodes from firing -->

        <el-input
            v-if="isRenaming"
            v-input-focus
            v-model="newName"

            @focus.once="onFocus"
            @blur="renameCancel"

            @mousedown.native.stop="() => {}"
            @click.native.stop="() => {}"

            @keyup.native.enter="renameComplete"
            @keyup.native.esc="renameCancel"></el-input>
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
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';
import FontAwesomeIcon from '@fortawesome/vue-fontawesome';

import {
    CollectionList,
    CollectionListMap,
    CollectionTree,
    CollectionState
} from '../../store/modules/collection/index';
import CollectionBus from './collection-bus';

const StateCL = namespace('collection', State);
const ActionCL = namespace('collection', Action);

// TODO: need colors for tree item highlighting
// selected
// on hover
// selected on hover

// TODO: need to decide what to do with the list icons; how to colour them; how to make sure colours don't interfere with higlighting colours'

@Component({
    components: {
        FontAwesomeIcon
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
    @ActionCL setListName: any;

    @Inject() bus: CollectionBus;

    @Prop() item: CollectionTree;

    @StateCL selectedLists: CollectionList[];
    @StateCL lists: CollectionListMap;
    @StateCL((state: CollectionState) => state.index.defaultListId)
    defaultListId: string;

    // TODO: oin list action

    get list(): CollectionList {
        return this.lists[this.item.listId]!;
    }

    get isSelected(): boolean {
        return this.selectedLists.some(
            selectedList => this.list.id === selectedList.id
        );
    }

    isRenaming: boolean = false;
    newName: string | null = null;

    mounted(): void {
        this.bus.$on('rename-start', this.renameStart);

        this.bus.mountComplete(this.list.id);
    }

    onPinClick(): void {}

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

    /**
     * Preselect the current list name on focus.
     */
    onFocus(event: FocusEvent): void {
        (<HTMLInputElement>event.target).select();
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

// TODO: move this inot common styles
.icon-button {
    color: $even-darker-secondary-colour;
    border: none;
    background: transparent;
    padding: 0;
    margin: 0;
}

.collection-item {
    height: 34px;
    display: flex;
    align-items: center;
    // margin: 0 0.5rem 0 0.5rem;

    margin-left: 1.5rem;

    span {
        line-height: 1.5rem;
    }

    &.selected,
    &:hover {
        .hidden-button {
            opacity: 1;
        }
    }

    &.selected .highlight {
        background-color: darken($secondary-colour, 10%);
    }

    &:hover .highlight {
        background-color: $secondary-colour;
    }

    .highlight {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
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

.icon-button {
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
}

.el-input /deep/ {
    font-size: 1rem;

    input {
        font-family: Segoe UI;
        height: 1.5rem;
        border-radius: 0;
    }
}

// adjust visual center
.pin-flag {
    svg {
        position: relative;
        top: 2px;
    }
}
</style>
