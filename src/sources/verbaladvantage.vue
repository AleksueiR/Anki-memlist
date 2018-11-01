<template>
    <div>
        <source-view :definition="definition" :word="word">

            <section slot="after-group-list" class="description">
                <p v-html="vaWord.description" v-if="vaWord"></p>
            </section>

        </source-view>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import vaWords from '@/../assets/full-list.json';

type VAList = { [name: string]: VAWord };
// const vaWords: { [name: string]: VAWord } = {};

import loglevel from 'loglevel';
const log: loglevel.Logger = loglevel.getLogger(`source`);

import { Word } from './../store/modules/words';

import SourceView from './../components/editor/source-view.vue';
import { Source, Definition } from './source.class';

interface VAWord {
    id: number;
    pronunciation: string;
    description: string;
}

@Component({
    components: {
        'source-view': SourceView
    }
})
export default class VerbalAdvantageSource extends Source {
    @Watch('word')
    onWordChanged(val: Word | null) {
        // TODO: word changes are not picked up correctly and `hasContent` sometimes is not updated correctly

        log.info('word changes');
        if (!val) {
            this.definition = null;
            log.info('word is not set');
            return;
        }

        if (!this.vaWord) {
            this.definition = null;
            log.info('cannot find VA word');
            return; /// sfd
        }

        this.definition = {
            groups: [
                {
                    parts: [],
                    pronunciations: [
                        {
                            part: '',
                            spellings: [this.vaWord.pronunciation],
                            audios: []
                        }
                    ],
                    notes: [],
                    phrases: []
                }
            ]
        };
    }

    mounted(): void {
        this.onWordChanged(this.word);
    }

    /**
     * VA words are capitalized, so need to capitalize the search word before searching.
     */
    get normalizedWord(): string {
        const letters = this.word.text.toLowerCase().split('');
        letters[0] = letters[0].toUpperCase();

        return letters.join('');
    }

    get vaWord(): VAWord | null {
        return (vaWords as VAList)[this.normalizedWord] || null;
    }
}
</script>

<style lang="scss" scoped>
.description {
    margin: 0 1.5em;
}
</style>
