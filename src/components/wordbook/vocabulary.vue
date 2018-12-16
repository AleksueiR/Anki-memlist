<template>
    <source-view :word="word" :definition="definition" :wordbook="wordbook">
        <section slot="before-group-list" class="descriptions">
            <p v-html="definition.shortDescription"></p>
            <p v-html="definition.longDescription"></p>
        </section>
    </source-view>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';

import WordbookMixin from './wordbook-mixin';
import { VocabularyDefinition } from '@/api/wordbook/vocabulary';

@Component
export default class VocabularyV extends mixins(WordbookMixin) {
    definition: VocabularyDefinition;
}
</script>

<style lang="scss" scoped>
.descriptions {
    margin: 0.5em 1.5em 0 1.5em;
}
</style>
