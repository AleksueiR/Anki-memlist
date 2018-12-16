<template>
    <source-view :word="word" :definition="definition" :wordbook="wordbook">
        <section slot="after-group-list" class="description">
            <p v-html="definition.description"></p>

            <span>
                level: {{ Math.floor(definition.id / 50) + 1 }}; word: {{ definition.id % 50 }}; id: {{ definition.id }}
            </span>
        </section>
    </source-view>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';

import WordbookMixin from './wordbook-mixin';
import { VADefinition } from '@/api/wordbook/verbaladvantage';

@Component
export default class VerbalAdvantageV extends mixins(WordbookMixin) {
    definition: VADefinition;
}
</script>

<style lang="scss" scoped>
.description {
    margin: 0 1.5em;
}
</style>
