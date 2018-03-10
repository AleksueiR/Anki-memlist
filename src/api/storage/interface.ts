import { CollectionState, CollectionIndex, CollectionList, CollectionTree } from './../../store/modules/collection';

export default interface Storage {
    id: string;

    hasCollection(): Promise<boolean>;

    loadCollection(): Promise<CollectionState>;
    loadIndex(): Promise<CollectionIndex>;
    loadList(listId: string): Promise<CollectionList>;

    saveCollection(state: CollectionState): Promise<void>;
    saveIndex(index: CollectionIndex): Promise<void>;
    saveList(list: CollectionList): Promise<void>;

    deleteList(listId: string): Promise<void>;
};
