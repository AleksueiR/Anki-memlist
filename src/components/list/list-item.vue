<template>
    <div class="list-item uk-flex uk-flex-middle"
        @click="event => selectWord({ wordId: word.id, annex: event.ctrlKey })"
        @mouseover="isHovered = true"
        @mouseleave="isHovered = false"
        :class="{ over: isOver, checked: selectedWords.includes(word) }">

        <a
            href="#"
            uk-tooltip="delay: 500; title: Favourite"
            uk-icon="ratio: 0.7; icon: star"
            class="uk-icon uk-position-center-left item-control star"
            v-if="isControlsVisible || word.favourite"
            :class="{ active: word.favourite }"></a>

        <span class="item-text uk-flex-1">{{ word.text }} </span>

        <template v-if="isControlsVisible">
            <a
                href="#"
                uk-tooltip="delay: 1500; title: View menu"
                uk-icon="ratio: 0.7; icon: more"
                @click.stop="positionDropdown"
                class="uk-margin-small-left uk-icon item-control hidden"></a>
            <div class="drrrr" uk-dropdown="mode: click; pos: right-center" ref="dropdown">
                <ul class="uk-nav uk-dropdown-nav">
                    <li class="uk-active"><a href="#">Active</a></li>
                    <li><a href="#">Item</a></li>
                    <li class="uk-nav-header">Header</li>
                    <li><a href="#">Item</a></li>
                    <li><a href="#">Item</a></li>
                    <li class="uk-nav-divider"></li>
                    <li><a href="#">Item</a></li>
                </ul>
            </div>

            <a
                href="#"
                uk-tooltip="delay: 500; title: Archive"
                uk-icon="ratio: 0.7; icon: check"
                class=" uk-icon item-control hidden"></a>

            <a
                href="#"
                uk-tooltip="delay: 500; title: Remove"
                uk-icon="ratio: 0.7; icon: close"
                class="uk-margin-small-right uk-icon item-control hidden"></a>
        </template>

        <span
            uk-icon="ratio: 0.7; icon: comment"
            class="uk-margin-small-left uk-margin-small-right uk-icon item-control transient"
            v-show="!isControlsVisible"
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
import UIkit from 'uikit';

import { CollectionWord } from '../../store/modules/collection/index';

const StateCL = namespace('collection', State);
const GetterCL = namespace('collection', Getter);
const ActionCL = namespace('collection', Action);

@Component
export default class WordItem extends Vue {
    @StateCL selectedWords: CollectionWord[];

    @ActionCL selectWord: (wordId: string) => void;
    @ActionCL
    archiveWord: (payload: { wordId: string; archived: boolean }) => void;
    @ActionCL removeWord: (wordId: string) => void;

    @Prop() word: CollectionWord;

    isHovered: boolean = false;
    isMenuOpened: boolean = false;
    get isControlsVisible(): boolean {
        return this.isHovered || this.isMenuOpened;
    }

    get isSelected(): boolean {
        return this.selectedWords.includes(this.word);
    }

    isOver: boolean = false;

    dateFormat(date: number): string {
        return moment(date).fromNow(); //format('YYYY-MM-DD HH:mm:ss');
    }

    /* archive(): void {
        this.$emit('archive', this.word);
    }

    select(): void {
        console.log('edit clicked!');
        // this.$emit('edit', this.word);
        this.$emit('select', this.word);
    }

    remove(): void {
        this.$emit('remove', this.word);
    } */

    positionDropdown(event: MouseEvent): void {
        // const a = UIkit.dropdown('.drrrr');

        const dropdown = this.$refs.dropdown as HTMLElement;
        const bbox = dropdown.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.left = `${bbox.left}px`;
        dropdown.style.top = `${bbox.top}px`;
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.list-item {
    position: relative;
    height: 34px;

    &.checked {
        background-color: darken($secondary-colour, 10%);
    }

    &:hover {
        background-color: $secondary-colour;

        /* .item-control {
            &.hidden {
                display: block;
            }
            &.transient {
                display: none;
            }
        } */
    }
}

.item-text {
    padding-left: 0.5rem + 2rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    user-select: none;
    pointer-events: none;
}

.item-control {
    padding: 0.5rem;

    &.star {
        left: 0.5rem;
    }

    &.hidden {
        //display: none;
    }

    &.active {
        // display: block;
        color: $accent-colour;
    }
}

/* .el-row {
    height: 36px;
    padding: 8px;
    cursor: pointer;
}

button {
    border: none;
    background: none;
}

.word-controls {
    text-align: right;
}

.over {
    // background-color: $secondary-colour;
} */
</style>
