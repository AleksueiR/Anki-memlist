<template>
    <li @click="event => selectWord({ wordId: word.id, annex: event.ctrlKey })"
        @mouseover="isOver = true"
        @mouseleave="isOver = false"
        class="list-item"
        :class="{ over: isOver, checked: selectedWords.includes(word) }">

        <el-row type="flex" align="middle" >
            <el-col :span="12">
                <span>{{ word.text }} {{ selectedWords.includes(word) }} <!-- /{{ word.archived }}/ ({{ dateFormat(word.dateAdded) }} ) --></span>
            </el-col>
            <el-col :span="12" v-if="true || isOver" class="word-controls">
                <el-button-group>
                    <el-tooltip content="Mark as added" placement="top-start">
                        <el-button icon="el-icon-check" @click.stop.prevent="archiveWord({ wordId: word.id })" size="small"></el-button>
                    </el-tooltip>
                    <el-tooltip content="Remove from list" placement="top-start">
                        <el-button icon="el-icon-delete" @click.stop.prevent="removeWord({ wordId: word.id })" size="small"></el-button>
                    </el-tooltip>
                </el-button-group>
            </el-col>
        </el-row>

    </li>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';

import moment from 'moment';

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
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.list-item {
    &.checked {
        background-color: darken($secondary-colour, 10%);
    }

    &:hover {
        background-color: $secondary-colour;
    }
}

.el-row {
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
}
</style>
