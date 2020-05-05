<template>
    <source-view :word="word" :definition="definition" :wordbook="wordbook">
        <section slot="before-group-list" class="descriptions">
            <p v-html="definition.shortDescription"></p>
            <p v-html="definition.longDescription"></p>

            <div v-if="definition.examples.length > 0">
                <h4 class="title">Examples</h4>
                <source-examples :collection="definition.examples" class="source-examples"></source-examples>
            </div>
        </section>
    </source-view>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';

import SourceExamples from './../editor/source-examples.vue';

import WordbookMixin from './wordbook-mixin';
import { VocabularyDefinition } from '@/api/wordbook/vocabulary';

@Component({
    components: { 'source-examples': SourceExamples }
})
export default class VocabularyV extends mixins(WordbookMixin) {
    definition: VocabularyDefinition;
}
</script>

<style lang="scss" scoped>
.descriptions {
    margin: 0.5em 1.5em 0 1.5em;
}

.title {
    font-size: 1.6rem;
    margin: 0 0 0.5em 0;
}

.source-examples {
    margin-left: 26px;
}
</style>
