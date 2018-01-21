import {
    CollectionState,
    CollectionIndex,
    CollectionList,
    ListTree
} from './../../store/modules/collection';

export default interface Storage {
    id: string;

    hasCollection(): Promise<boolean>;

    initCollection(state: CollectionState): Promise<void>;
    saveIndex(index: CollectionIndex): Promise<void>;
    saveList(list: CollectionList): Promise<void>;

    getIndex(): Promise<CollectionIndex>;
    getList(listId: string): Promise<CollectionList>;
};
