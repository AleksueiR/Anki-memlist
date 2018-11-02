<template>

    <!-- TODO: add a proper hightlight like in collection-item -->
    <div class="list-item"
        @click="select"
        @mouseover="isHovered = true"
        @mouseleave="isHovered = false"
        :class="{ hover: isHovered || isTargeted, selected: isSelected, focused: isFocused }">

        <button
            @click="toggleFavourite"
            uk-tooltip="delay: 500; title: Favourite"
            class="uk-button uk-button-none list-item-control first"
            v-if="isTargeted || word.favourite"
            :class="{ active: word.favourite }">
            <octo-icon name="star"></octo-icon>
        </button>

        <span class="list-item-text">{{ word.text }}</span>

        <span
            class="uk-icon list-item-control"
            uk-tooltip="delay: 1500; title: Has notes"
            v-show="!isTargeted"
            v-if="word.hasNotes">
            <octo-icon name="comment"></octo-icon>
        </span>

        <template v-if="isTargeted">

            <button
                @click="vnull"
                uk-tooltip="delay: 500; title: View menu"
                class="uk-button uk-button-none list-item-control"
                v-if="isTargeted">
                <octo-icon name="kebab-horizontal"></octo-icon>
            </button>
            <uk-dropdown
                :pos="'right-center'"
                :delay-hide="0"
                @show="isMenuOpened = true"
                @hide="isMenuOpened = false">

                <ul class="uk-nav uk-dropdown-nav">

                    <li :class="{ 'uk-active': word.favourite }">
                        <a href="#" class="uk-nav-check"
                            @click.stop.prevent="toggleFavourite">

                            <span>Favourite</span>
                            <octo-icon name="check" v-if="word.favourite"></octo-icon>
                        </a>
                    </li>

                    <li :class="{ 'uk-active': word.archived }">
                        <a href="#" class="uk-nav-check"
                            @click.stop.prevent="toggleArchived">

                            <span>Archived</span>
                            <octo-icon name="check" v-if="word.archived"></octo-icon>
                        </a>
                    </li>

                    <li class="uk-nav-divider"></li>

                    <li><a href="#" @click.stop.prevent="rename(word)">Edit</a></li>
                    <li><a href="#" @click.stop.prevent="deleteWord">Delete</a></li>
                    <li><a href="#" @click.stop.prevent="vnull">Move</a></li>

                </ul>

            </uk-dropdown>

        </template>

        <button
            @click.stop="toggleArchived"
            uk-tooltip="delay: 500; title: Archive"
            class="uk-button uk-button-none list-item-control"
            v-if="isTargeted || word.archived"
            :class="{ active: word.archived }">
            <octo-icon name="check"></octo-icon>
        </button>

    </div>
</template>

<script lang="ts">
import { Vue, Component, Inject, Model, Prop, Watch, Emit } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';
import { mixins } from 'vue-class-component';

import { CollectionWord } from '../../store/modules/collection/index';
import UkDropdownV from './../bits/uk-dropdown.vue';

const StateCL = namespace('collection', State);
const GetterCL = namespace('collection', Getter);

@Component({
    components: {
        'uk-dropdown': UkDropdownV
    }
})
export default class ListEntryV extends Vue {
    @Emit('select')
    emSelect(payload: { wordId: string; append: boolean }) {}

    @Emit('favourite')
    emFavourite(payload: { wordId: string; value: boolean }) {}

    @Emit('archive')
    emArchive(payload: { wordId: string; value: boolean }) {}

    @Emit('delete')
    emDelete(payload: { wordId: string }) {}

    /**
     * Rename event is used the pool view, so it doesn't need the full store payload signature.
     */
    @Emit()
    rename(entry: CollectionWord) {}

    @StateCL
    selectedWords: CollectionWord[];

    @Prop()
    isFocused: boolean;

    @Prop()
    word: CollectionWord;

    isHovered: boolean = false;
    isMenuOpened: boolean = false;

    /**
     * Indicates that this item is engaged: either is hovered or over its menu is opened.
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
@import './../../styles/collection-pool';

// needed for the menu?
.uk-nav a.uk-flex {
    display: flex !important;
}
</style>
