<template>

    <div class="list-item uk-flex uk-flex-middle"
        tabindex="0"
        @click="select"
        @mouseover="isHovered = true"
        @mouseleave="isHovered = false"
        :class="{ hover: isHovered || isTargeted, selected: isSelected }">

        <template v-if="!isRenaming">
            <a
                href="#"
                @click.stop="toggleFavourite"
                uk-tooltip="delay: 500; title: Favourite"
                class="uk-icon uk-position-center-left item-control favourite"
                v-if="isTargeted || word.favourite"
                :class="{ active: word.favourite }">
                <octo-icon name="star"></octo-icon>
            </a>

            <span class="item-text uk-flex-1">{{ word.text }}</span>

            <template v-if="isTargeted">

                <a
                    href="#"
                    uk-tooltip="delay: 1500; title: View menu"
                    @click.stop="vnull"
                    class="uk-margin-small-left uk-icon item-control">
                    <octo-icon name="kebab-horizontal"></octo-icon>
                </a>
                <uk-dropdown
                    :pos="'right-center'"
                    :delay-hide="0"
                    @show="isMenuOpened = true"
                    @hide="isMenuOpened = false">

                    <ul class="uk-nav uk-dropdown-nav">

                        <li :class="{ 'uk-active': word.favourite }">
                            <a href="#" class="uk-flex uk-flex-middle"
                                @click.stop="toggleFavourite">

                                <span class="uk-flex-1">Favourite</span>
                                <octo-icon name="check" v-if="word.favourite"></octo-icon>
                            </a>
                        </li>

                        <li :class="{ 'uk-active': word.archived }">
                            <a href="#" class="uk-flex uk-flex-middle"
                                @click.stop="toggleArchived">

                                <span class="uk-flex-1">Archived</span>
                                <octo-icon name="check" v-if="word.archived"></octo-icon>
                            </a>
                        </li>

                        <li class="uk-nav-divider"></li>

                        <li><a href="#">Edit</a></li>
                        <li><a href="#" @click.stop="deleteWord">Delete</a></li>
                        <li><a href="#">Move</a></li>

                    </ul>

                </uk-dropdown>

                <a
                    href="#"
                    uk-tooltip="delay: 500; title: Archive"
                    class="uk-margin-small-right uk-icon item-control">
                    <octo-icon name="check"></octo-icon>
                </a>
            </template>

            <span
                class="uk-margin-small-left uk-margin-small-right uk-icon item-control"
                v-show="!isTargeted"
                v-if="word.hasNotes">
                <octo-icon name="comment"></octo-icon>
            </span>
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

import { CollectionWord } from '../../store/modules/collection/index';
import UkDropdownV from './../bits/uk-dropdown.vue';
import RenameInputV from './../bits/rename-input.vue';
import RenameMixin from './../../mixins/rename-mixin';

const StateCL = namespace('collection', State);
const GetterCL = namespace('collection', Getter);

@Component({
    components: {
        'uk-dropdown': UkDropdownV,
        'rename-input': RenameInputV
    }
})
export default class WordItem extends mixins(RenameMixin) {
    @Emit('select')
    emSelect(payload: { wordId: string; append: boolean }) {}

    @Emit('favourite')
    emFavourite(payload: { wordId: string; value: boolean }) {}

    @Emit('archive')
    emArchive(payload: { wordId: string; value: boolean }) {}

    @Emit('delete')
    emDelete(payload: { wordId: string }) {}

    @StateCL selectedWords: CollectionWord[];

    @Prop() word: CollectionWord;

    isHovered: boolean = false;
    isMenuOpened: boolean = false;

    // used by the rename mixin
    get id(): string {
        return this.word.id;
    }

    // used by the rename mixin
    getCurrentName(): string {
        return this.word.text;
    }

    /**
     * Indicates that this item is enhaged: either is hovered or over its menu is opened.
     */
    get isTargeted(): boolean {
        return this.isHovered || this.isMenuOpened;
    }

    get isSelected(): boolean {
        return this.selectedWords.includes(this.word);
    }

    select(event: MouseEvent): void {
        this.emSelect({ wordId: this.word.id, append: event.ctrlKey });
    }

    toggleFavourite(): void {
        this.emFavourite({ wordId: this.word.id, value: !this.word.favourite });
    }

    toggleArchived(): void {
        this.emArchive({ wordId: this.word.id, value: !this.word.archived });
    }

    deleteWord(): void {
        this.emDelete({ wordId: this.word.id });
    }

    vnull(): void {}
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.list-item {
    position: relative;
    height: 30px;
    font-size: 0.8rem;

    &.selected {
        background-color: rgba($color: $accent-colour, $alpha: 0.1);
        border-right: 4px solid $accent-colour;
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

.item-control {
    padding: 0 0.5rem;

    &.favourite {
        left: 0.25rem;
    }

    &.active {
        color: $accent-colour;
    }
}

.uk-nav a.uk-flex {
    display: flex !important;
}

.rename-input {
    font-size: 0.8rem;
    height: 1.5rem;
    margin-left: calc(0.5rem + 30px - 10px);
}
</style>
