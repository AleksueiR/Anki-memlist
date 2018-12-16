import axios, { AxiosResponse } from 'axios';
import to from 'await-to-js';
import cheerio from 'cheerio';
import artoo from 'artoo-js';

import { CollectionWord } from '@/store/modules/collection';
import {
    Definition,
    DefinitionGroup,
    DefinitionPronunciation,
    DefinitionSense,
    DefinitionPart,
    Wordbook,
    formatExample
} from './common';

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
                        return `https://audio.vocab.com/1.0/us/${$(this).attr('data-audio')}.mp3`;
                    }
                }
            }
        }
    },
    wordForms: {
        scrape: {
            iterator: '.wordforms .definitionNavigator > tbody > tr:nth-child(odd)',
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
                                    data: function($: any) {
                                        return formatExample($(this).text());
                                    }
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
                                                data: function($: any) {
                                                    return formatExample($(this).text());
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
    }
};

export class VocabularyDefinition extends Definition {
    shortDescription: string;
    longDescription: string;
}

class VocabularyBook extends Wordbook {
    constructor(id: string, name: string) {
        super(id, name);
    }

    async load(value: CollectionWord): Promise<Definition> {
        const [error, response] = await to(
            axios.get(`https://www.vocabulary.com/dictionary/definition.ajax?search=${value.text}&lang=en`)
        );

        if (!response) {
            throw new Error('Definition not found');
        }

        const vocabularyDefinition = this.normalizeDefinition(response);

        if (!vocabularyDefinition) {
            throw new Error('Definition not found');
        }

        return vocabularyDefinition;
    }

    normalizeDefinition(response: AxiosResponse<any>): VocabularyDefinition | null {
        artoo.setContext(cheerio.load(response.data));
        const scrapes = artoo.scrape('.centeredContent', scrapeConfig);

        if (scrapes.length === 0) {
            return null;
        }

        const scrape = scrapes[0];

        const definition: VocabularyDefinition = new VocabularyDefinition();
        definition.shortDescription = scrape.short;
        definition.longDescription = scrape.long;

        const partMap: { [name: string]: string } = {
            adj: 'adjective',
            adv: 'adverb',
            n: 'noun',
            v: 'verb'
        };

        // group senses by part
        scrape.groups.forEach((group: any, index: number) => {
            // map short part names to their full names
            group.senses.forEach((sense: any) => (sense.part = partMap[sense.part]));

            const scrapedGroup: DefinitionGroup = new DefinitionGroup(
                this.groupSensesByPart(group.senses),
                this.organizePronunciations(scrape, index)
            );
            definition.groups.push(scrapedGroup);
        });

        // console.log('scraped groups', definition);

        return definition;
    }

    /**
     * Matches pronunciations to corresponding groups if possible; if not, adds all pronunciations or a single pronunciation to all the groups.
     * @returns DefinitionPronunciation[]
     */
    organizePronunciations(scrape: any, groupIndex: number): DefinitionPronunciation[] {
        const scrapedPronunciations: DefinitionPronunciation[] = [];

        // If the number of word forms matches the number of groups, assume each word form belongs to a single group
        if (scrape.wordForms.length === scrape.groups.length) {
            const pronunciation = scrape.wordForms[groupIndex];
            // each word form can reference several parts
            pronunciation.part.split('').forEach((part: string) => {
                scrapedPronunciations.push(new DefinitionPronunciation(part, [], [pronunciation.audio]));
            });
        } else if (scrape.wordForms.length > 0) {
            scrape.wordForms.forEach((pronunciation: any) => {
                pronunciation.part.split('').forEach((part: string) => {
                    scrapedPronunciations.push(new DefinitionPronunciation(part, [], [pronunciation.audio]));
                });
            });
        } else {
            const pronunciation = scrape.pronunciations[0];
            scrapedPronunciations.push(new DefinitionPronunciation('', [], [pronunciation.audio]));
        }

        return scrapedPronunciations;
    }

    groupSensesByPart(senses: DefinitionSense[]): DefinitionPart[] {
        return senses.reduce((parts: DefinitionPart[], sense: any) => {
            // vocabulary.com stores `part` name on `sense` object; need to move it to `part`
            const partName: string = sense.part;

            let scrapedPart: DefinitionPart | undefined = parts.find((part: DefinitionPart) => part.name === partName);

            if (!scrapedPart) {
                scrapedPart = new DefinitionPart(partName);
                parts.push(scrapedPart);
            }

            scrapedPart.senses.push(sense);

            return parts;
        }, []);
    }
}

export default new VocabularyBook('vocabulary-wordbook', 'Vocabulary.com');
