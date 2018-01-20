<template>
    <li @click="edit"
        @mouseover="isOver = true"
        @mouseleave="isOver = false"
        :class="{ over: isOver }">
        <el-row type="flex" align="middle" >
            <el-col :span="12">
                <span>{{ word.text }} <!-- /{{ word.archived }}/ ({{ dateFormat(word.dateAdded) }} ) --></span>
            </el-col>
            <el-col :span="12" v-if="isOver" class="word-controls">
                <el-button-group>
                    <el-tooltip content="Mark as added" placement="top-start">
                        <el-button icon="el-icon-check" @click.stop.prevent="archive" size="small"></el-button>
                    </el-tooltip>
                    <el-tooltip content="Remove from list" placement="top-start">
                        <el-button icon="el-icon-delete" @click.stop.prevent="remove" size="small"></el-button>
                    </el-tooltip>
                </el-button-group>
            </el-col>
        </el-row>
    </li>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import moment from 'moment';

import {
    Word,
    dFetchWods,
    dSyncWords,
    rItems
} from './../../store/modules/words';

import { EventBus, WORD_SELECTED } from './../../event-bus';

@Component
export default class WordItem extends Vue {
    @Prop() word: Word;

    isOver: boolean = false;

    dateFormat(date: number): string {
        return moment(date).fromNow(); //format('YYYY-MM-DD HH:mm:ss');
    }

    archive(): void {
        this.$emit('archive', this.word);
    }

    edit(): void {
        console.log('edit clicked!');
        // this.$emit('edit', this.word);
        this.$emit('select', this.word);
    }

    remove(): void {
        this.$emit('remove', this.word);
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

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
    background-color: $secondary-colour;
}
</style>
