import { db, Word, GroupDisplayMode, WordArchived } from '@/api/db';
import { reduceArrayToObject } from '@/util';
import { EntrySet, Stash, StashModule, StashModuleState } from '../internal';

export type WordSet = EntrySet<Word>;

export class WordsState extends StashModuleState<Word> {
    selectedIds: number[] = [];
}

export class WordsModule extends StashModule<Word, WordsState> {
    constructor(stash: Stash) {
        super(stash, db.words, WordsState);
    }

    /**
     * Fetch words belonging to the currently active groups.
     *
     * @returns {Promise<void>}
     */
    async fetchGroupWords(): Promise<void> {
        const words = await this.table
            .where('memberGroupIds')
            .anyOf(this.$stash.groups.selectedIds)
            .toArray();

        const wordSet = reduceArrayToObject(words);

        this.setAll(wordSet);

        // TODO: check if the currently selected words need to be deselected
    }

    /**
     * Count words in the specified group. Return the word count.
     *
     * @protected
     * @param {number} groupId
     * @param {WordArchived} [isArchived]
     * @returns {Promise<number>}
     * @memberof WordsModule
     */
    async countWordsInAGroup(groupId: number, isArchived?: WordArchived): Promise<number> {
        const isArchivedClause = isArchived !== undefined ? { isArchived } : {};

        return await this.table.where({ memberGroupIds: groupId, ...isArchivedClause }).count();
    }
}
