import { db, Journal, Word, WordArchived } from '@/api/db';
import { reduceArrayToObject } from '@/util';
import log from 'loglevel';
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
     * Return 0 if active journal is not set.
     *
     * @returns {(Promise<void | 0>)}
     * @memberof WordsModule
     */
    async fetchGroupWords(): Promise<void | 0> {
        const activeJournal = this.getActiveJournal();
        if (!activeJournal) return 0;

        const selectedGroupIds = this.$stash.groups.selectedIds;

        const words = await this.table
            .where('memberGroupIds')
            .anyOf(selectedGroupIds)
            .filter(word => word.journalId === activeJournal.id)
            .toArray();

        const wordSet = reduceArrayToObject(words);

        this.setAll(wordSet);

        // TODO: check if the currently selected words need to be deselected
    }

    /**
     * Count words in the specified group. Return the word count.
     * Return 0 if the active journal is not set or the group doesn't exist or the group has 0 words.
     *
     * @protected
     * @param {number} groupId
     * @param {WordArchived} [isArchived]
     * @returns {Promise<number>}
     * @memberof WordsModule
     */
    async countWordsInAGroup(groupId: number, isArchived?: WordArchived): Promise<number> {
        const activeJournal = this.getActiveJournal();
        if (!activeJournal) return 0;

        return await this.table
            .where({ memberGroupIds: groupId })
            .filter(word => {
                if (word.journalId !== activeJournal.id) return false;
                // if `isArchived` value is set, check that it matches word's `isArchived` status
                if (isArchived !== undefined && word.isArchived !== isArchived) return false;

                return true;
            })
            .count();
    }

    /**
     * Return an active journal or undefined if the active journal is not set.
     *
     * @protected
     * @returns {(Journal | undefined)}
     * @memberof WordsModule
     */
    protected getActiveJournal(): Journal | undefined {
        const activeJournal = this.$stash.journals.active;
        if (!activeJournal) return log.warn('words: Active journal is not set'), undefined;

        return activeJournal;
    }

    /**
     * Check if the supplied word id is valid and belongs to the active journal.
     *
     * @param {number} id
     * @returns {boolean}
     * @memberof WordsModule
     */
    isValid(id: number): boolean;
    isValid(ids: number[]): boolean;
    isValid(value: number | number[]): boolean {
        if (Array.isArray(value)) {
            return value.every(id => this.isValid(id));
        }

        const activeJournal = this.getActiveJournal();
        if (!activeJournal) return false;

        const word = this.get(value);
        if (!word) return false;

        if (word.journalId !== activeJournal.id) {
            log.warn(`words/isValid: Word ${value} doesn't belong to Journal ${activeJournal.id}.`);
            return false;
        }

        return true;
    }
}
