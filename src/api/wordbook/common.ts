import { CollectionWord } from '@/store/modules/collection';
import { Definition } from '@/sources/source.class';

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
