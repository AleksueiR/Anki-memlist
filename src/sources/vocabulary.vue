<template>
    <div>
        <h2>Vocabulary.com</h2>

        <div v-if="isExist">
            <!-- <p>{{ vaWord.pronunciation }}</p> -->
            <!-- <p>{{ definition.short }}</p>

            <p>{{ definition.long }}</p> -->

            <p v-html="definition.short"></p>
            <p v-html="definition.long"></p>

            <ul class="group-list">
                <li v-for="(group, index) in definition.groups" :key="`group-${index}`" class="group-item">

                    <h3 class="group-title">
                        <span>{{ word.text }}<span class="sup" v-if="definition.groups.length > 1">{{ index + 1 }}</span>
                        </span>
                    </h3>

                    <div v-for="(part, index) in group.parts" :key="`part-${index}`" class="part">
                        <span class="part-designator" :class="part.name">{{ part.name }}</span>

                        <ul class="sense-list">
                            <li v-for="(sense, senseIndex) in part.senses" :key="`sense-${senseIndex}`" class="sense-item">

                                <span class="sense-index">{{ senseIndex + 1 }}</span>

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

                                            <span class="sense-index">{{ senseIndex + 1 }}.{{ subsenseIndex + 1 }}</span>

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
                    </div>
                </li>
            </ul>

            <div v-for="(pronunciation, index) in definition.pronunciations" :key="`pronunciation-${index}`">
                {{ pronunciation.part }} <span v-for="(spelling, index) in pronunciation.spellings" :key="`spelling-${index}`">{{ spelling }}</span>

                <!-- {{ pronunciation.audio }} -->

                <a class="speaker" @click.stop.prevent="playSound">
                    <audio ref="player" controls :src="pronunciation.audio"></audio>
                    <i class="el-icon-service"></i>
                </a>
            </div>

            <!-- <a class="speaker" @click.stop.prevent="playSound">
                <audio ref="player" controls :src="group.pronunciations.find(p => p.part === part.name).audio"></audio>
                <i class="el-icon-service"></i>
            </a> -->

            <!-- {{ ++senseIndex }} <span class="part-designator">{{ part.name }}</span>
            <p v-html="sense.grammaticalNote"></p>
            <p v-html="sense.senseRegisters"></p>
            <p v-html="sense.definition"></p> -->

            <!-- <p v-html="subsense.grammaticalNote"></p>
            <p v-html="subsense.senseRegisters"></p>
            <p v-html="subsense.definition"></p>
            <p v-for="(example, index) in subsense.examples.slice(0, 3)" :key="`example-${index}`" v-html="example"></p> -->

        </div>
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

import { WordSource, Definition } from './source.class';

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
    // definition: Definition = {};

    @Watch('word')
    async onWordChanged(val: Word | null) {
        if (!val) {
            log.info('word is not set');
            return '';
        }

        this.definition = await axios
            .get(
                `https://www.vocabulary.com/dictionary/definition.ajax?search=${val.text}&lang=en`
            )
            .then(response => {
                artoo.setContext(cheerio.load(response.data));

                const scrape = artoo.scrape('.centeredContent', scrapeConfig);

                console.log(scrape[0]);

                if (scrape.length > 0) {
                    const partMap: { [name: string]: string } = {
                        adj: 'adjective',
                        adv: 'adverb',
                        n: 'noun',
                        v: 'verb'
                    };

                    let parts;

                    // group senses by part
                    scrape[0].groups.forEach((group: any) => {
                        // use full name for parts
                        group.senses.forEach(
                            (sense: any) => (sense.part = partMap[sense.part])
                        );
                        group.parts = this.groupSensesByPart(group.senses);
                    });

                    console.log('parts', scrape[0]);

                    return scrape[0];
                }

                return null;
            });
    }

    mounted(): void {
        this.onWordChanged(this.word);
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

    /* get normalizedWord(): string {
        const letters = this.word.text.toLowerCase().split('');
        letters[0] = letters[0].toUpperCase();

        return letters.join('');
    } */

    get isExist(): boolean {
        if (!this.definition) {
            return false;
        }

        return true;
    }

    toRoman(num: number | string): string {
        if (this.isString(num)) {
            num = parseInt(num);
        }

        let result = '';
        const decimal = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
        const roman = [
            'M',
            'CM',
            'D',
            'CD',
            'C',
            'XC',
            'L',
            'XL',
            'X',
            'IX',
            'V',
            'IV',
            'I'
        ];
        for (let i = 0; i <= decimal.length; i++) {
            while (num % decimal[i] < num) {
                result += roman[i];
                num -= decimal[i];
            }
        }
        return result;
    }

    isString(x: any): x is string {
        return typeof x === 'string';
    }
}
</script>

<style lang="scss" scoped>
.group-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.group-item {
    margin-top: 2em;
}

.group-title {
    font-size: 1.5em;
    font-weight: normal;
    background-color: #f3f3f3;
    padding: 0em 1.5rem;
    line-height: 2em;
    margin: 0;

    .sup {
        position: relative;
        bottom: 0.6em;
        font-size: 0.7em;
        left: 0.1em;
    }
}

.part {
    margin: 1.5em 0 0 1.5em;
}

.part-designator {
    background-color: #f8b002;
    color: white;
    padding: 0px 4px 2px 4px;
    display: inline-block;
    font-style: italic;
    font-size: 1em;
    line-height: 1.5em;

    &.noun {
        background-color: #019875;
        &.plural {
            background-color: #00af86;
        }
    }

    &.adjective {
        background-color: #2c3e50;
    }

    &.adverb {
        background-color: #c0392d;
    }

    &.verb {
        background-color: #2980d9;
    }
}

.sense-list {
    list-style: none;
    margin: 1em 0 0;
    padding: 0;
}

.sense-item {
    display: flex;
    flex: 1;
    margin: 0;
    margin: 1em 0 0 0;
    border-right: 2px solid rgb(201, 201, 201);
}

.sense-index {
    margin-right: 1em;
    margin-top: 1em;
    color: #676767;
    font-weight: bold;
}

.sense-content {
    margin: 1em 0 0 0;
    flex: 1;
    p {
        margin: 0;
    }

    .sense-definition-block {
    }
}

.sense-example-list {
    margin-top: 1.5em;
    font-family: Courier New, Courier, monospace;
}

.sense-example-item {
    margin: 0.7em 0;
}

.subsense-list {
    margin-right: 0.5em;
}
audio {
    display: none;
}
</style>


