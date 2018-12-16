import vaWords from '@/../assets/full-list.json';
import { Definition } from '@/sources/source.class';
import { CollectionWord } from '@/store/modules/collection';
import { Wordbook } from './common';

type VAList = { [name: string]: VAWord };

interface VAWord {
    id: number;
    pronunciation: string;
    description: string;
}

interface VADefinition extends Definition {
    id: number;
    pronunciation: string;
    description: string;
}

class VerbalAdvantageBook extends Wordbook {
    constructor(id: string, name: string) {
        super(id, name);
    }

    async load(value: CollectionWord): Promise<Definition> {
        const letters = value.text.toLowerCase().split('');
        letters[0] = letters[0].toUpperCase();

        // VA words are capitalized, so need to capitalize the search word before searching
        const normalizedWord = letters.join('');

        const vaWord: VAWord | undefined = (vaWords as VAList)[normalizedWord];

        if (!vaWord) {
            throw new Error('Definition not found');
        }

        const vaDefinition: VADefinition = {
            ...vaWord,
            groups: [
                {
                    parts: [],
                    pronunciations: [
                        {
                            part: '',
                            spellings: [vaWord.pronunciation],
                            audios: []
                        }
                    ],
                    notes: [],
                    phrases: []
                }
            ]
        };

        return vaDefinition;
    }
}

export default new VerbalAdvantageBook('verbaladvantage-source', 'Verbal Advantage');
