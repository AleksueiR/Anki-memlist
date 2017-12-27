<template>
    <div>
        <h4>Vocabulary.com</h4>

        <div v-if="isExist">
            <!-- <p>{{ vaWord.pronunciation }}</p> -->
            <!-- <p>{{ definition.short }}</p>

            <p>{{ definition.long }}</p> -->

            <p v-html="definition.short"></p>
            <p v-html="definition.long"></p>

            <div v-for="(group, index) in definition.groups" :key="`group-${index}`">
                {{++index}} <div v-for="(ordinal, index) in group" :key="`ordinal-${index}`">
                    <div v-for="(sense, index) in ordinal" :key="`sense-${index}`">
                        <p v-html="sense.part"></p>
                        <p v-html="sense.definition"></p>
                        <p v-html="sense.examples"></p>
                        <hr>
                    </div>
                </div>
            </div>

            <a class="speaker" @click.stop.prevent="playSound">
                <audio ref="player" controls :src="audioSource"></audio>
                <i class="el-icon-service"></i>
            </a>

            <audio ref="player" controls>
                <source :src="audioSource" type="audio/mpeg">
            </audio>

            <!-- <p>https://audio.vocab.com/1.0/us/{{ definition.soundUri }}.mp3</p> -->

        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import { Word } from './../store/modules/words';

import axios, { AxiosPromise, AxiosInstance } from 'axios';

import cheerio from 'cheerio';
import artoo from 'artoo-js';

import { WordSource, WordDefinition } from './source.class';

const scrapeConfig = {
    short: {
        sel: '.main .short',
        method: 'html'
    },
    long: {
        sel: '.main .long',
        method: 'html'
    },
    soundUri: {
        sel: 'a[data-audio]',
        attr: 'data-audio'
    },
    groups: {
        sel: '.definitions',
        scrape: {
            iterator: '.group',
            data: {
                sel: '',
                scrape: {
                    iterator: '.ordinal',
                    data: {
                        scrape: {
                            iterator: '.sense',
                            data: {
                                part: {
                                    sel: 'h3.definition > a',
                                    method: 'text'
                                },
                                definition: function($: any) {
                                    return $(this)
                                        .find('h3.definition')
                                        .contents()
                                        .filter(function(this: any) {
                                            return this.nodeType == 3;
                                        })
                                        .text()
                                        .trim();
                                },
                                examples: {
                                    sel: '.defContent .example',
                                    method: 'html'
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

@Component
export default class VocabularySource extends WordSource {
    definition: WordDefinition = {};

    get audioSource(): string {
        if (!this.isExist || !this.definition.soundUri) {
            return '';
        }

        return `https://audio.vocab.com/1.0/us/${this.definition.soundUri}.mp3`;
    }

    async created() {
        this.definition = await axios
            .get(
                `https://www.vocabulary.com/dictionary/definition.ajax?search=${this
                    .word.text}&lang=en`
            )
            .then(response => {
                artoo.setContext(cheerio.load(response.data));

                const scrape = artoo.scrape('.centeredContent', scrapeConfig);

                console.log(scrape[0]);

                if (scrape.length > 0) {
                    return scrape[0];
                }

                return null;
            });
    }

    get normalizedWord(): string {
        const letters = this.word.text.toLowerCase().split('');
        letters[0] = letters[0].toUpperCase();

        return letters.join('');
    }

    get isExist(): boolean {
        if (!this.definition) {
            return false;
        }

        return true;
    }
}
</script>

<style lang="scss" scoped>
audio {
    display: none;
}
</style>


