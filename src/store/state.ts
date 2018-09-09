import { AppState } from '@/store/modules/app';
import { WordsState } from '@/store/modules/words';
import { CollectionState } from '@/store/modules/collection';

export interface RootState {
    app: AppState;
    collection: CollectionState;
    words: WordsState;
}
