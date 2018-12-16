import { AppState } from '@/store/modules/app';
// import { WordsState } from '@/store/modules/words';
import { CollectionState } from '@/store/modules/collection';
import { DisplayState } from '@/store/modules/display';

export interface RootState {
    app: AppState;
    collection: CollectionState;
    display: DisplayState;
    // words: WordsState;
}
