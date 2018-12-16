import { CollectionWord } from '@/store/modules/collection';
import { Definition } from '@/sources/source.class';

export class Wordbook {
    constructor(public id: string, public name: string) {}

    load(value: CollectionWord): Promise<Definition> {
        throw new Error('Must be implemented by a child class');
    }
}
