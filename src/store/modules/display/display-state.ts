import { CollectionWord } from '../collection';
import { Wordbook, Definition } from '@/api/wordbook';

export class DisplayState {
    /**
     * The word whose definitions are being retrieved by the wordbooks.
     *
     * @type {(CollectionWord | null)}
     * @memberof DisplayState
     */
    word: CollectionWord | null = null;

    /**
     * A list of wordbook/definitions tuples for the word provided. If a definition is missing from one of the wordbook, it's not included in this list.
     *
     * @type {[Wordbook, Definition][]}
     * @memberof DisplayState
     */
    definitions: [Wordbook, Definition][] = [];

    /**
     * A list of registered wordbooks which will be used to search for word definitions.
     *
     * @type {Wordbook[]}
     * @memberof DisplayState
     */
    wordbooks: Wordbook[] = [];

    blah: object = {
        a1: {
            b: 4
        },
        a2: {
            b: 4
        },
        a3: {
            b: 4
        }
    };
}
