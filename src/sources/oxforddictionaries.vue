<template>
    <div>
        <source-view :definition="definition" :word="word" v-if="isExist"></source-view>

        <!-- <ul class="group-list">
            <li v-for="(group, index) in definition.groups" :key="`group-${index}`" class="group-item"> -->

                <!-- <h3 class="group-title">
                    <span>{{ word.text }}<span class="sup" v-if="definition.groups.length > 1">{{ index + 1 }}</span>
                    </span>
                </h3>

                <div v-for="(part, index) in group.parts" :key="`part-${index}`" class="part">
                    <span class="part-designator" :class="part.name">{{ part.name }}</span>

                    <ul class="sense-list">
                        <li v-for="(sense, senseIndex) in part.senses" :key="`sense-${senseIndex}`" class="sense-item">

                            <span class="sense-index">{{ toRoman(senseIndex + 1) }}.</span>

                            <div class="sense-content">
                                <p class="sense-definition-block">

                                    <span v-if="sense.grammaticalNote" class="sense-gram-note">[{{ sense.grammaticalNote }}]</span>
                                    <span v-if="sense.senseRegisters" class="sense-registers">[{{ sense.senseRegisters }}]</span>
                                    <span class="sense-definition">{{ sense.definition }}</span>
                                </p>

                                <div class="sense-example-list" v-if="sense.examples.length > 0">
                                    <li v-for="(example, index) in sense.examples.slice(0, 3)" :key="`example-${index}`" class="sense-example-item">
                                        <p v-html="example"></p>
                                    </li>
                                </div>

                                <ul class="sense-list subsense-list" v-if="sense.subsenses.length > 0">
                                    <li v-for="(subsense, subsenseIndex) in sense.subsenses" :key="`subsense-${subsenseIndex}`" class="sense-item">

                                        <span class="sense-index">{{ toRoman(senseIndex + 1) }}.{{ toRoman(subsenseIndex + 1) }}</span>

                                        <div class="sense-content">
                                            <p class="sense-definition-block">
                                                <span v-if="subsense.grammaticalNote" class="sense-gram-note">[{{ subsense.grammaticalNote }}]</span>
                                                <span v-if="subsense.senseRegisters" class="sense-registers">[{{ subsense.senseRegisters }}]</span>
                                                <span class="sense-definition">{{ subsense.definition }}</span>
                                            </p>

                                            <div class="sense-example-list" v-if="subsense.examples.length > 0">
                                                <li v-for="(example, index) in subsense.examples.slice(0, 3)" :key="`example-${index}`" class="sense-example-item">
                                                    <p v-html="example"></p>
                                                </li>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </li>
                    </ul>
                </div> -->

                <!-- <div v-for="(pronunciation, index) in group.pronunciations" :key="`pronunciation-${index}`">
                    {{ pronunciation.part }} <span v-for="(spelling, index) in pronunciation.spellings" :key="`spelling-${index}`">{{ spelling }}</span>



                    <a class="speaker" @click.stop.prevent="playSound">
                        <audio ref="player" controls :src="pronunciation.audios[0]"></audio>
                        <i class="el-icon-service"></i>
                    </a>
                </div> -->

                <!-- <section v-if="group.phrases.length > 0">
                    <h4>Phrases</h4>

                    <div v-for="(phrase, index) in group.phrases" :key="`phrase-${index}`">
                        <h5>{{ phrase.text }}</h5>
                        <p><span v-if="phrase.senseRegisters">[{{ phrase.senseRegisters }}]</span> {{ phrase.definition }}</p>

                        <p v-for="(example, index) in phrase.examples.slice(0, 3)" :key="`example-${index}`">{{ example }}</p>
                    </div>
                </section>

                <section>
                    <h4>Notes</h4>

                    <div v-for="(note, index) in group.notes" :key="`note-${index}`">
                        <h5>{{ note.title }}</h5>

                        <p v-for="(line, index) in note.lines" :key="`line-${index}`">{{ line }}</p>
                    </div>
                </section> -->
            <!-- </li>
        </ul> -->

        <!-- <div v-for="(group, index) in definition.groups" :key="`group-${index}`">

            <div v-for="(part, index) in group.parts" :key="`part-${index}`">
                {{ part.name }}

                <div v-for="(sense, senseIndex) in part.senses" :key="`sense-${senseIndex}`">
                    {{ ++senseIndex }}

                    <p>
                        <span v-if="sense.grammaticalNote">[{{ sense.grammaticalNote }}]</span>
                        <span v-if="sense.senseRegisters">[{{ sense.senseRegisters }}]</span>
                        {{ sense.definition }}
                    </p>

                    <p v-for="(example, index) in sense.examples.slice(0, 3)" :key="`example-${index}`" v-html="example"></p>

                    <div v-for="(subsense, subsenseIndex) in sense.subsenses" :key="`subsense-${subsenseIndex}`">
                        {{ senseIndex }}.{{ ++subsenseIndex }}

                        <p>
                            <span v-if="subsense.grammaticalNote">[{{ subsense.grammaticalNote }}]</span>
                            <span v-if="subsense.senseRegisters">[{{ subsense.senseRegisters }}]</span>
                            {{ subsense.definition }}
                        </p>

                        <p v-for="(example, index) in subsense.examples.slice(0, 3)" :key="`example-${index}`" v-html="example"></p>
                    </div>

                    <hr>
                </div>
            </div>

            <div v-for="(pronunciation, index) in group.pronunciations" :key="`pronunciation-${index}`">
                {{ pronunciation.part }} <span v-for="(spelling, index) in pronunciation.spellings" :key="`spelling-${index}`">{{ spelling }}</span>

                  <a class="speaker" @click.stop.prevent="playSound">
                    <audio ref="player" controls :src="pronunciation.audio"></audio>
                    <i class="el-icon-service"></i>
                </a>
            </div>

            <section v-if="group.phrases.length > 0">
                <h3>Phrases</h3>

                <div v-for="(phrase, index) in group.phrases" :key="`phrase-${index}`">
                    <h4>{{ phrase.text }}</h4>
                    <p><span v-if="phrase.senseRegisters">[{{ phrase.senseRegisters }}]</span> {{ phrase.definition }}</p>

                    <p v-for="(example, index) in phrase.examples.slice(0, 3)" :key="`example-${index}`">{{ example }}</p>
                </div>
            </section>


            <h3>Notes</h3>

            <div v-for="(note, index) in group.notes" :key="`note-${index}`">
                <h4>{{ note.title }}</h4>

                <p v-for="(line, index) in note.lines" :key="`line-${index}`">{{ line }}</p>
            </div>
            ___
        </div> -->

    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import { Word } from './../store/modules/words';

import axios, { AxiosPromise, AxiosInstance } from 'axios';

import loglevel from 'loglevel';
const log: loglevel.Logger = loglevel.getLogger(`source`);

import cheerio from 'cheerio';
import artoo from 'artoo-js';

import SourceView from './../components/editor/source-view.vue';
import { Source, Definition } from './source.class';

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
                                                sel: '> .grammatical_note'
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
                    spellings: {
                        scrape: {
                            iterator: '.phoneticspelling',
                            data: 'text'
                        }
                    },
                    audios: {
                        scrape: {
                            iterator: '.pronunciations audio',
                            data: function($: any) {
                                return $(this).attr('src');
                            }
                        }
                    }
                };

                const notesConfig = {
                    title: {
                        sel:
                            'h3:not([class$="phrases-title"]), h2:not([class$="phrases-title"])'
                    },
                    lines: {
                        scrape: {
                            iterator: '.senseInnerWrapper > p',
                            data: 'text'
                        }
                    }
                };

                const phrasesConfig = {
                    text: {
                        sel: '.ind .phrase'
                    },
                    senseRegisters: {
                        sel: '',
                        method: function($: any) {
                            return $(this)
                                .next()
                                .find('.phrase_sense .sense-registers')
                                .text()
                                .trim();
                        }
                    },
                    definition: {
                        sel: '',
                        method: function($: any) {
                            return $(this)
                                .next()
                                .find('.phrase_sense > .trg:first-child .ind')
                                .text();
                        }
                    },
                    examples: {
                        sel: '',
                        method: function($: any) {
                            console.log('phraseexampels', $(this));

                            return artoo.scrape($(this).next(), {
                                scrape: {
                                    iterator: '.phrase_sense .ex',
                                    data: 'text'
                                }
                            })[0];
                        }
                    }
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
                    ),
                    phrases: artoo.scrape(
                        $(this)
                            .nextUntil('.entryHead')
                            .find(
                                '.phrases-title ~ .senseInnerWrapper > .semb.gramb > li'
                            ),
                        phrasesConfig
                    )
                };
            }
        }
    }
};

// handle cross-references as definitions: see cordial / another term for liqueur

@Component({
    components: {
        'source-view': SourceView
    }
})
export default class OxfordDictionariesSource extends Source {
    // definition: Definition = {};

    @Watch('word')
    async onWordChanged(val: Word | null) {
        log.info('fsd');

        if (!val) {
            log.info('word is not set');
            return '';
        }

        this.definition = await axios
            .get(`https://en.oxforddictionaries.com/definition/${val.text}`)
            .then(response => {
                const a = cheerio.load(response.data);

                artoo.setContext(cheerio.load(response.data));

                const scrape = artoo.scrape('.entryWrapper', scrapeConfig);

                console.log(scrape[0]);

                if (scrape.length > 0) {
                    /* scrape[0].groups.forEach((group: any) => {
                        group.senses.forEach((sense: any) => {
                            sense.examples.forEach((example: string) =>  example.rep)
                        })
                    } */

                    return scrape[0];
                }

                return null;
            });
    }

    mounted(): void {
        this.onWordChanged(this.word);
    }

    get isExist(): boolean {
        if (!this.definition) {
            return false;
        }

        return true;
    }

    isString(x: any): x is string {
        return typeof x === 'string';
    }
}
</script>

<style lang="scss" scoped>

</style>
