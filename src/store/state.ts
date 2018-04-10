import { WordsState } from '@/store/modules/words';
import { AppState } from '@/store/modules/app';

export interface RootState {
    words: WordsState;
    app: AppState;
}
