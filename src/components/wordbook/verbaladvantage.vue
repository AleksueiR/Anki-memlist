<template>
    <div>
        <source-view :definition="definition" :word="word">
            <section slot="after-group-list" class="description">
                <p v-html="vaWord.description" v-if="vaWord"></p>

                <span v-if="vaWord"
                    >level: {{ Math.floor(vaWord.id / 50) + 1 }}; word: {{ vaWord.id % 50 }}; id: {{ vaWord.id }}</span
                >
            </section>
        </source-view>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

/* import loglevel from 'loglevel';
const log: loglevel.Logger = loglevel.getLogger(`source`);
 */

import { Source, Definition } from '@/sources/source.class';

interface VAWord {
    id: number;
    pronunciation: string;
    description: string;
}

@Component
export default class VerbalAdvantageSource extends Source {}
</script>

<style lang="scss" scoped>
.description {
    margin: 0 1.5em;
}
</style>
