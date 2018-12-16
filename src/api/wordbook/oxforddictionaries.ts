import axios, { AxiosResponse } from 'axios';
import to from 'await-to-js';
import cheerio from 'cheerio';
import artoo from 'artoo-js';

import { Definition } from '@/sources/source.class';
import { CollectionWord } from '@/store/modules/collection';
import { Wordbook, formatExample } from './common';

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
                                        data: function($: any) {
                                            return formatExample($(this).text());
                                        }
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
                        sel: 'h3:not([class$="phrases-title"]), h2:not([class$="phrases-title"])'
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
                            // console.log('phraseexampels', $(this));

                            return artoo.scrape($(this).next(), {
                                scrape: {
                                    iterator: '.phrase_sense .ex',
                                    data: function($: any) {
                                        return formatExample($(this).text());
                                    }
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
                            .find('.phrases-title ~ .senseInnerWrapper > .semb.gramb > li'),
                        phrasesConfig
                    )
                };
            }
        }
    }
};

class OxfordDictionariesBook extends Wordbook {
    constructor(id: string, name: string) {
        super(id, name);
    }

    async load(value: CollectionWord): Promise<Definition> {
        const [error, response] = await to(axios.get(`https://en.oxforddictionaries.com/definition/${value.text}`));

        if (!response) {
            throw new Error('Definition not found');
        }

        artoo.setContext(cheerio.load(response.data));

        const scrape = artoo.scrape('.entryWrapper', scrapeConfig) as Definition[];

        // console.log(scrape[0]);

        if (scrape.length === 0 || scrape[0].groups.length === 0) {
            throw new Error('Definition not found');
        }

        return scrape[0];
    }
}

export default new OxfordDictionariesBook('oxforddictionaries-wordbook', 'Oxford Dictionaries');
