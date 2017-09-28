<template>

    <v-list-tile @click="edit">

        <v-list-tile-content>
            <v-list-tile-title>{{ word.text }}</v-list-tile-title>
        </v-list-tile-content>

        <v-list-tile-action>
            <v-btn icon small class="ma-0"
                @click="archive">
                <v-icon>mdi-archive</v-icon>
            </v-btn>
        </v-list-tile-action>

        <v-list-tile-action>
            <v-btn icon small class="ma-0"
                @click="remove">
                <v-icon>mdi-delete</v-icon>
            </v-btn>
        </v-list-tile-action>
    </v-list-tile>

    <!--div>

        {{ word.text }} - {{ word.archived }}

        <v-btn flat @click="edit">edit</v-btn>

        <v-btn icon small class="ml-3 ma-0"
            @click="archive">
            <v-icon>mdi-archive</v-icon>
        </v-btn>

        <v-btn icon small class="ma-0"
            @click="remove">
            <v-icon>mdi-delete</v-icon>
        </v-btn>

    </div-->
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import { Word, dFetchWods, dSyncWords, rItems } from './../../store/modules/words';

@Component
export default class WordItem extends Vue {
    @Prop()
    word: Word

    archive():void {
        this.$emit('archive', this.word);
    }

    edit():void {
        this.$emit('edit', this.word);
    }

    remove():void {
        this.$emit('remove', this.word);
    }
}
</script>

<style lang="scss" scoped>
button.btn--small {
    .icon {
        font-size: 16px;
    }
}
</style>


