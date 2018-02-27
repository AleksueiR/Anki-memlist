<template>
    <div class="list-item uk-flex uk-flex-middle"
        @click="select"
        @mouseover="isHovered = true"
        @mouseleave="isHovered = false"
        :class="{ hover: isHovered || isTargeted, checked: isSelected }">

        <a
            href="#"
            @click.stop="toggleFavourite"
            uk-tooltip="delay: 500; title: Favourite"
            uk-icon="ratio: 0.7; icon: star"
            class="uk-icon uk-position-center-left item-control favourite"
            v-if="isTargeted || word.favourite"
            :class="{ active: word.favourite }"></a>

        <span class="item-text uk-flex-1">{{ word.text }}</span>

        <template v-if="isTargeted">
            <!-- <a
                href="#"
                uk-tooltip="delay: 500; title: Delete"
                uk-icon="ratio: 0.7; icon: close"
                @click.stop="deleteWord"
                class="uk-icon item-control"></a> -->

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

                    <li :class="{ 'uk-active': word.favourite }">
                        <a href="#" class="uk-flex uk-flex-middle"
                            @click.stop="toggleFavourite">

                            <span class="uk-flex-1">Favourite</span>
                            <span uk-icon="icon: check" v-if="word.favourite"></span>
                        </a>
                    </li>

                    <li :class="{ 'uk-active': word.archived }">
                        <a href="#" class="uk-flex uk-flex-middle"
                            @click.stop="toggleArchived">

                            <span class="uk-flex-1">Archived</span>
                            <span uk-icon="icon: check" v-if="word.archived"></span>
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
                uk-icon="ratio: 0.7; icon: check"
                class="uk-margin-small-right uk-icon item-control"></a>
        </template>

        <span
            uk-icon="ratio: 0.7; icon: comment"
            class="uk-margin-small-left uk-margin-small-right uk-icon item-control"
            v-show="!isTargeted"
            v-if="word.hasNotes"></span>

    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {
    Component,
    Inject,
    Model,
    Prop,
    Watch,
    Emit
} from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';

import moment from 'moment';

import { CollectionWord } from '../../store/modules/collection/index';
import UkDropdownV from '../bits/uk-dropdown.vue';

const StateCL = namespace('collection', State);
const GetterCL = namespace('collection', Getter);
const ActionCL = namespace('collection', Action);

@Component({
    components: {
        'uk-dropdown': UkDropdownV
    }
})
export default class WordItem extends Vue {
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
    get isTargeted(): boolean {
        return this.isHovered || this.isMenuOpened;
    }

    get isSelected(): boolean {
        return this.selectedWords.includes(this.word);
    }

    /* dateFormat(date: number): string {
        return moment(date).fromNow(); //format('YYYY-MM-DD HH:mm:ss');
    } */

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
    height: 34px;

    &.checked {
        background-color: rgba($color: $accent-colour, $alpha: 0.1);
        border-right: 4px solid $accent-colour;
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
}

.item-control {
    padding: 0.5rem;

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
</style>
