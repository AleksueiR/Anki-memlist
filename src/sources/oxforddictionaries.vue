<template>
    <div>
        <h4>en.oxforddictionaries</h4>

        <div v-for="(group, index) in definition.groups" :key="`group-${index}`">
            <div v-for="(part, index) in group.parts" :key="`part-${index}`">
                {{ part.name }}

                <!-- <a class="speaker" @click.stop.prevent="playSound">
                    <audio ref="player" controls :src="group.pronunciations.find(p => p.part === part.name).audio"></audio>
                    <i class="el-icon-service"></i>
                </a> -->

                <div v-for="(sense, senseIndex) in part.senses" :key="`sense-${senseIndex}`">
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

            <div v-for="(pronunciation, index) in group.pronunciations" :key="`pronunciation-${index}`">
                {{ pronunciation.part }} {{ pronunciation.spelling }} {{ pronunciation.audio }}

                <a class="speaker" @click.stop.prevent="playSound">
                    <audio ref="player" controls :src="pronunciation.audio"></audio>
                    <i class="el-icon-service"></i>
                </a>
            </div>

            <h3>Notes</h3>

            <div v-for="(note, index) in group.notes" :key="`note-${index}`">
                <h4>{{ note.title }}</h4>

                {{ note.text }}
            </div>
            ___
        </div>

        <!-- {{ definition }} -->

        <!-- <p v-html="definition.groups"></p> -->

        <!-- <div v-if="isExist">

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

            <audio ref="player" controls>
                <source :src="audioSource" type="audio/mpeg">
            </audio>



        </div> -->
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
    groups: {
        scrape: {
            iterator: '.entryHead',
            data: function($: any) {
                const partConfig = {
                    name: {
                        sel: '.ps.pos .pos'
                    },
                    senses: {
                        scrape: {
                            iterator: '.semb > li > .trg',
                            data: {
                                grammaticalNote: {
                                    sel: '> p .grammatical_note'
                                },
                                senseRegisters: {
                                    sel: '> p .sense-registers'
                                },
                                definition: {
                                    sel: '> p > .ind'
                                },
                                examples: {
                                    scrape: {
                                        iterator: '> .exg .ex, > .examples .ex',
                                        data: 'text'
                                    }
                                },
                                subsenses: {
                                    scrape: {
                                        iterator: '.subSense',
                                        data: {
                                            grammaticalNote: {
                                                sel: '.grammatical_note'
                                            },
                                            senseRegisters: {
                                                sel: '.sense-registers'
                                            },
                                            definition: {
                                                sel: '.ind'
                                            },
                                            examples: {
                                                scrape: {
                                                    iterator: '.ex',
                                                    data: 'text'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };

                const pronunciationConfig = {
                    part: {
                        sel: '.ps'
                    },
                    spelling: {
                        sel: '.phoneticspelling'
                    },
                    audio: {
                        sel: '.pronunciations audio',
                        attr: 'src'
                    }
                };

                const notesConfig = {
                    title: { sel: 'strong' },
                    text: { sel: '.senseInnerWrapper' }
                };

                return {
                    parts: artoo.scrape(
                        $(this)
                            .nextUntil('.entryHead')
                            .filter('.gramb'),
                        partConfig
                    ),
                    pronunciations: artoo.scrape(
                        $(this)
                            .nextUntil('.entryHead')
                            .filter('.pronSection')
                            .find('.pron'),
                        pronunciationConfig
                    ),
                    notes: artoo.scrape(
                        $(this)
                            .nextUntil('.entryHead')
                            .filter('.etymology'),
                        notesConfig
                    )
                } /* {
                    parts: artoo.scrape(
                        $(this).nextUntil('.entryHead'),
                        partConfig
                    ),

                } */;
            }
        }
    }
};

@Component
export default class OxfordDictionariesSource extends WordSource {
    definition: WordDefinition = {};

    /* dfs() {
        const a = [];
        a.find();
    } */

    async created() {
        this.definition = await axios
            .get(
                `https://en.oxforddictionaries.com/definition/${this.word.text}`
            )
            .then(response => {
                const a = cheerio.load(response.data);

                artoo.setContext(cheerio.load(response.data));

                const scrape = artoo.scrape('.entryWrapper', scrapeConfig);

                console.log(scrape[0]);

                if (scrape.length > 0) {
                    return scrape[0];
                }

                return null;
            });
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


