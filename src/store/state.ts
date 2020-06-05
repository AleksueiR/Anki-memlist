import { AppState } from '@/store/modules/app';

import { CollectionState } from '@/store/modules/collection';
import { DisplayState } from '@/store/modules/display';

import { JournalsState } from '@/store/modules/journals';
import { GroupsState } from '@/store/modules/groups';
import { WordsState } from '@/store/modules/words';

export interface RootState {
    app: AppState;
    collection: CollectionState;
    display: DisplayState;

    journals: JournalsState;
    groups: GroupsState;
    words: WordsState;
}
