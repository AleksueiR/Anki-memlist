<template>
    <div class="collection-item"
        :class="{ selected: isSelected }">

        <span
            class="icon-button default-flag"
            @click.stop="onBookmarkClick"
            v-if="item.listId === defaultListId">
            <font-awesome-icon icon="bookmark" />
        </span>

        <!-- <button
            class="icon-button default-flag"
            @click.stop="onBookmarkClick"
            v-if="item.listId === defaultListId">
            <font-awesome-icon icon="bookmark" />
        </button> -->

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

    /* onClick(event: MouseEvent): void {
        console.log('field click');

        event.stopPropagation();
    } */

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

.collection-item {
    height: 1.5rem;
    display: flex;
    align-items: center;
    // margin: 0 0.5rem 0 0.5rem;

    margin-left: 1.5rem;

    span {
        line-height: 1.5rem;
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
    }
}

.meti {
}

.icon-button {
    color: $even-darker-secondary-colour;
    border: none;
    background: transparent;
    padding: 0;
    margin: 0;
}

.default-flag {
    color: $primary-colour;
    display: flex;
    align-items: center;
    justify-content: center;

    cursor: default !important;
}

.pin-flag,
.default-flag {
    position: absolute;
    left: 0;
}

.icon-button {
    font-size: 0.8rem;
    cursor: pointer;
    width: 1.5rem;
    height: 1.5rem;
}

.el-input /deep/ {
    font-size: 1rem;

    input {
        font-family: Segoe UI;
        height: 1.5rem;
        border-radius: 0;
    }
}
</style>
