<template>
    <div>
        <source-view :definition="definition" :word="word" v-if="isExist">

            <section slot="before-group-list" class="descriptions">
                <p v-html="shortDescription"></p>
                <p v-html="longDescription"></p>
            </section>

        </source-view>

        <div v-if="isExist">
            <!-- <p v-html="definition.short"></p>
            <p v-html="definition.long"></p> -->

            <!--ul class="group-list">
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
            </ul-->

            <!-- <div v-for="(pronunciation, index) in definition.pronunciations" :key="`pronunciation-${index}`">
                {{ pronunciation.part }} <span v-for="(spelling, index) in pronunciation.spellings" :key="`spelling-${index}`">{{ spelling }}</span>



                <a class="speaker" @click.stop.prevent="playSound">
                    <audio ref="player" controls :src="pronunciation.audio"></audio>
                    <i class="el-icon-service"></i>
                </a>
            </div> -->

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

import axios, { AxiosResponse } from 'axios';

import loglevel from 'loglevel';
const log: loglevel.Logger = loglevel.getLogger(`source`);

import cheerio from 'cheerio';
import artoo from 'artoo-js';

import {
    Source,
    Definition,
    DefinitionGroup,
    DefinitionPart,
    DefinitionSense,
    DefinitionPronunciation
} from './source.class';

import SourceView from './../components/editor/source-view.vue';

const scrapeConfig = {
    short: {
        sel: '.main .short',
        method: 'html'
    },
    long: {
        sel: '.main .long',
        method: 'html'
    },
    pronunciations: {
        scrape: {
            iterator: '.dynamictext a[data-audio]:first-child',
            data: {
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
    wordForms: {
        scrape: {
            iterator:
                '.wordforms .definitionNavigator > tbody > tr:nth-child(odd)',
            data: function($: any) {
                return {
                    part: $(this)
                        .find('.posList .pos')
                        .text(),
                    audio: `https://audio.vocab.com/1.0/us/${$(this)
                        .next()
                        .find('.variant .listen')
                        .attr('data-audio')}.mp3`
                };
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

@Component({
    components: {
        'source-view': SourceView
    }
})
export default class VocabularySource extends Source {
    // definition: Definition = {};

    shortDescription: string = '';
    longDescription: string = '';

    mounted(): void {
        this.onWordChanged(this.word);
    }

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
            .then(this.normalizeDefinition);
    }

    normalizeDefinition(response: AxiosResponse<any>): Definition | null {
        // TODO: handle errors in response
        artoo.setContext(cheerio.load(response.data));
        const scrapes = artoo.scrape('.centeredContent', scrapeConfig);

        if (scrapes.length === 0) {
            log.info(`Can't find definition`);
            return null;
        }

        const scrape = scrapes[0];

        log.info(`scrape`, scrape);

        this.shortDescription = scrape.short;
        this.longDescription = scrape.long;

        const partMap: { [name: string]: string } = {
            adj: 'adjective',
            adv: 'adverb',
            n: 'noun',
            v: 'verb'
        };

        const scrapedDefinition: Definition = new Definition();

        // group senses by part
        scrape.groups.forEach((group: any, index: number) => {
            // map short part names to their full names
            group.senses.forEach(
                (sense: any) => (sense.part = partMap[sense.part])
            );

            const scrapedGroup: DefinitionGroup = new DefinitionGroup(
                this.groupSensesByPart(group.senses),
                this.organizePronunciations(scrape, index)
            );
            scrapedDefinition.groups.push(scrapedGroup);
        });

        console.log('scraped groups', scrapedDefinition);

        return scrapedDefinition;
    }

    organizePronunciations(
        scrape: any,
        groupIndex: number
    ): DefinitionPronunciation[] {
        const scrapedPronunciations: DefinitionPronunciation[] = [];

        // If the number of word forms matches the number of groups, assume each word form belongs to a single group
        if (scrape.wordForms.length === scrape.groups.length) {
            const pronunciation = scrape.wordForms[groupIndex];
            // each word form can reference several parts
            pronunciation.part.split('').forEach((part: string) => {
                scrapedPronunciations.push(
                    new DefinitionPronunciation(part, [], [pronunciation.audio])
                );
            });
        } else if (scrape.wordForms.length > 0) {
            scrape.wordForms.forEach((pronunciation: any) => {
                pronunciation.part.split('').forEach((part: string) => {
                    scrapedPronunciations.push(
                        new DefinitionPronunciation(
                            part,
                            [],
                            [pronunciation.audio]
                        )
                    );
                });
            });
        } else {
            const pronunciation = scrape.pronunciations[0];
            scrapedPronunciations.push(
                new DefinitionPronunciation('', [], [pronunciation.audio])
            );
        }

        return scrapedPronunciations;
    }

    groupSensesByPart(senses: DefinitionSense[]): DefinitionPart[] {
        return senses.reduce((parts: DefinitionPart[], sense: any) => {
            // vocabulary.com stores `part` name on `sense` object; need to move it to `part`
            const partName: string = sense.part;

            let scrapedPart: DefinitionPart | undefined = parts.find(
                (part: DefinitionPart) => part.name === partName
            );

            if (!scrapedPart) {
                scrapedPart = new DefinitionPart(partName);
                parts.push(scrapedPart);
            }

            scrapedPart.senses.push(sense);

            return parts;
        }, []);
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
}
</script>

<style lang="scss" scoped>
.descriptions {
    margin: 0 1.5em;
}

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


