import { CollectionWord } from '@/store/modules/collection';

export class Wordbook {
    constructor(public id: string, public name: string) {}

    load(value: CollectionWord): Promise<Definition> {
        throw new Error('Must be implemented by a child class');
    }
}

/**
 * Format sample sentences by stripping quotes, capitalizing first letters, and adding punctuation in the end (TODO:).
 *
 * @param {string} line
 * @returns {string}
 */
export function formatExample(line: string): string {
    line = line.trim().replace(/[\u2018\u2019\u201C\u201D]/g, '');
    // TODO: add a period at the end of the example if there is none.
    return line.charAt(0).toUpperCase() + line.slice(1);
}

export class Definition {
    constructor(public groups: DefinitionGroup[] = []) {}
}

export class DefinitionGroup {
    constructor(
        public parts: DefinitionPart[] = [],
        public pronunciations: DefinitionPronunciation[] = [],
        public notes: DefinitionNote[] = [],
        public phrases: DefinitionPhrase[] = []
    ) {}
}

export class DefinitionPart {
    constructor(public name: string = '', public senses: DefinitionSense[] = []) {}
}

export class DefinitionPronunciation {
    constructor(public part: string = '', public spellings: string[] = [], public audios: string[] = []) {}
}

export class DefinitionNote {
    constructor(public title: string = '', public lines: string[] = []) {}
}

export class DefinitionPhrase {
    constructor(
        public text: string = '',
        public senseRegisters: string = '',
        public definition: string = '',
        public examples: string[] = []
    ) {}
}

export class DefinitionSense {
    constructor(
        public grammaticalNote: string = '',
        public senseRegisters: string = '',
        public definition: string = '',
        public examples: string[] = [],
        public subsenses: DefinitionSense[] = []
    ) {}
}
