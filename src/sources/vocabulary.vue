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
                ===
                <div v-for="(part, index) in group.parts" :key="`part-${index}`">
                    {{ part.name }}

                    <!-- <a class="speaker" @click.stop.prevent="playSound">
                        <audio ref="player" controls :src="group.pronunciations.find(p => p.part === part.name).audio"></audio>
                        <i class="el-icon-service"></i>
                    </a> -->

                    <div v-for="(sense, senseIndex) in part.senses" :key="`sense-${senseIndex}`">
                        <!-- <p>{{ sense.part }}</p> -->
                        {{ ++senseIndex }}
                        <p v-html="sense.grammaticalNote"></p>
                        <p v-html="sense.senseRegisters"></p>
                        <p v-html="sense.definition"></p>
                        <p v-for="(example, index) in sense.examples.slice(0, 3)" :key="`example-${index}`" v-html="example"></p>

                        <div v-for="(subsense, subsenseIndex) in sense.subsenses" :key="`subsense-${subsenseIndex}`">
                            {{ senseIndex }}.{{ ++subsenseIndex }}
                            <p v-html="subsense.grammaticalNote"></p>
                            <p v-html="subsense.senseRegisters"></p>
                            <p v-html="subsense.definition"></p>
                            <p v-for="(example, index) in subsense.examples.slice(0, 3)" :key="`example-${index}`" v-html="example"></p>
                        </div>

                        <hr>
                    </div>
                </div>
            </div>

            <div v-for="(pronunciation, index) in definition.pronunciations" :key="`pronunciation-${index}`">
                {{ pronunciation.part }} <span v-for="(spelling, index) in pronunciation.spellings" :key="`spelling-${index}`">{{ spelling }}</span>

                <!-- {{ pronunciation.audio }} -->

                <a class="speaker" @click.stop.prevent="playSound">
                    <audio ref="player" controls :src="pronunciation.audio"></audio>
                    <i class="el-icon-service"></i>
                </a>
            </div>

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
    pronunciations: {
        scrape: {
            iterator: '.dynamictext a[data-audio]',
            data: {
                part: '_',
                spellings: '_',
                audio: {
                    sel: '',
                    method: function($: any) {
                        return `https://audio.vocab.com/1.0/us/${$(this).attr(
                            'data-audio'
                        )}.mp3`;
                    }
                }
            }
        }
    },
    groups: {
        sel: '.definitions',
        scrape: {
            iterator: '.group',
            data: {
                senses: {
                    scrape: {
                        iterator: '.ordinal',
                        data: {
                            part: {
                                sel: '.sense:nth-child(1) h3.definition > a'
                            },
                            definition: function($: any) {
                                return $(this)
                                    .find('.sense:nth-child(1) h3.definition')
                                    .contents()
                                    .filter(function(this: any) {
                                        return this.nodeType == 3;
                                    })
                                    .text()
                                    .trim();
                            },
                            examples: {
                                scrape: {
                                    iterator: '.sense:nth-child(1) .example',
                                    data: 'html'
                                }
                            },
                            subsenses: {
                                scrape: {
                                    iterator: '.sense:not(:nth-child(1))',
                                    data: {
                                        part: {
                                            sel: 'h3.definition > a'
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
                                            scrape: {
                                                iterator: '.example',
                                                data: 'html'
                                            }
                                        }
                                    }
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
                    let parts;

                    // group senses by part
                    scrape[0].groups.forEach(
                        (group: any) =>
                            (group.parts = this.groupSensesByPart(group.senses))
                    );

                    console.log('parts', scrape[0]);

                    return scrape[0];
                }

                return null;
            });
    }

    groupSensesByPart(senses: object[]): object[] {
        return senses.reduce((parts: any[], sense: any) => {
            const partName: string = sense.part;

            if (!parts.find((part: any) => part.name === partName)) {
                parts.push({ name: partName, senses: [] });
            }

            const part: {
                name: string;
                senses: any[];
            } = parts.find((part: any) => part.name === partName);

            part.senses.push(sense);

            return parts;
        }, []) as object[];
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


