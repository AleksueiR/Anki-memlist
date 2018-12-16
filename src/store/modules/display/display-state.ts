import { Definition } from '@/sources/source.class';
import { CollectionWord } from '../collection';
import { Wordbook } from '@/api/wordbook';

export class DisplayState {
    word: CollectionWord | null = null;

    definitions: [Wordbook, Definition][] = [];

    wordbooks: Wordbook[] = [];
}
