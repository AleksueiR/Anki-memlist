<template>
    <div class="collection-item"
        :class="{ selected: isSelected }">

        <!-- TODO: add higlight layer that spans the width of the row -->

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

        <span class="meti"
            v-if="!isRenaming">{{ list.name }} [{{ list.id }}] {{ list.index.length }}</span>

        <el-input
            v-if="isRenaming"
            v-input-focus
            v-model="newName"
            @focus.once="onFocus"
            @mousedown.native.stop="onClick"
            @click.native.stop="onClick"
            @blur="renameListStop(true)"
            @keyup.native.enter="renameListStop()"
            @keyup.native.esc="renameListStop(true)"></el-input>
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
    CollectionTree,
    CollectionState
} from '../../store/modules/collection/index';
import { CollectionBus } from './collection-view.vue';

const StateCL = namespace('collection', State);
const ActionCL = namespace('collection', Action);

@Component({
    components: {
        FontAwesomeIcon
    }
})
export default class CollectionItem extends Vue {
    @Inject() collectionBus: CollectionBus;

    @Prop() item: CollectionTree;

    @StateCL selectedLists: CollectionList[];
    @StateCL lists: Map<string, CollectionList>;
    @StateCL((state: CollectionState) => state.index.defaultListId)
    defaultListId: string;

    // TODO: oin list action

    get list(): CollectionList {
        return this.lists.get(this.item.listId)!;
    }

    get isSelected(): boolean {
        return this.selectedLists.some(
            selectedList => this.list.id === selectedList.id
        );
    }

    isRenaming: boolean = false;
    newName: string | null = null;

    mounted(): void {
        this.collectionBus.$on('rename-list-start', this.renameListStart);
    }

    onPinClick(): void {}

    renameListStart(listId: string): void {
        if (this.item.listId !== listId) {
            return;
        }
        this.isRenaming = true;
        this.newName = this.list.name;
    }

    renameListStop(cancel: boolean = false): void {
        if (!this.isRenaming) {
            return;
        }

        if (cancel) {
            this.newName = null;
        }

        this.isRenaming = false;
        this.collectionBus.renameListStop(this.item.listId, this.newName);
    }

    onClick(): void {}

    onFocus(event: FocusEvent): void {
        console.log('onfocus');
        (<HTMLInputElement>event.target).select();
    }

    onBlur(): void {
        console.log('onblur');
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
    height: 1.5rem;
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

    &.selected:before {
        background-color: darken($secondary-colour, 10%);
    }

    &:hover:before {
        background-color: $secondary-colour;
    }

    &:before {
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
