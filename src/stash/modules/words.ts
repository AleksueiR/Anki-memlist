import { db, Word, WordArchived } from '@/api/db';
import { notEmptyFilter, reduceArrayToObject, wrapInArray } from '@/util';
import log from 'loglevel';
import { NonJournalStashModule } from '../common';
import { EntrySet, Stash, StashModuleState } from '../internal';
import { SelectionMode } from './groups';

export type WordSet = EntrySet<Word>;

export class WordsState extends StashModuleState<Word> {
    selectedIds: number[] = [];
}

export class WordsModule extends NonJournalStashModule<Word, WordsState> {
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
     * Add a new word to the selected groups.
     * If adding fails, return 0;
     * If a single text was provided and added/linked, return the id of the word.
     * If several text were provided and added/linked, return an array of words ids.
     *
     * @param {string} text
     * @returns {(Promise<number | 0>)}
     * @memberof WordsModule
     */
    async new(text: string): Promise<number | 0>;
    async new(texts: string[]): Promise<(number | void)[] | 0>;
    async new(value: string | string[]): Promise<number | (number | void)[] | 0> {
        const activeJournal = this.getActiveJournal();
        if (!activeJournal) return 0;

        // remove empty lines, trim space
        let values = wrapInArray(value)
            .map(text => text.trim().toLocaleLowerCase())
            .filter(text => text !== '');

        values = [...new Set(values)]; // remove duplicates

        const selectedGroupIds = this.$stash.groups.selectedIds; // assume these ids are valid and no Root Group
        if (selectedGroupIds.length === 0) return log.warn('words/new: No groups are selected'), 0;

        return db
            .transaction('rw', this.table, async () => {
                // find existing words
                const existingWords = await this.table
                    .where('text')
                    .anyOf(values)
                    .filter(word => word.journalId === activeJournal.id) // filter by active journal
                    .toArray();

                const setMemberGroupIdsResult = await Promise.all(
                    existingWords.map(word => this.setMemberGroupIds(word, selectedGroupIds, SelectionMode.Add))
                );
                if (setMemberGroupIdsResult.includes(0)) return 0; // something broke

                // filter down to new words
                const existingWordsTexts = existingWords.map(word => word.text);
                const newTexts = values.filter(text => !existingWordsTexts.includes(text));

                let newWordIds: number[] = [];
                let newWords: Word[] = [];

                if (newTexts.length > 0) {
                    // write new words to the db
                    newWordIds = await this.table.bulkAdd(
                        newTexts.map(text => new Word(text, activeJournal.id, selectedGroupIds)),
                        { allKeys: true }
                    );

                    // check that new words have been written correctly
                    newWords = await this.table.bulkGet(newWordIds);
                    if (newWordIds.length !== newTexts.length)
                        return log.warn('words/new: Cannot write words to the db.'), 0;

                    this.addToAll(newWords);
                }

                await this.fetchGroupWords();
                await this.$stash.groups.refreshWordCounts(selectedGroupIds);

                const allModifiedWords = [...newWords, ...existingWords];

                if (!Array.isArray(value)) {
                    if (allModifiedWords.length > 1) log.warn('words/new: Something is wrong.'), 0;

                    return allModifiedWords[0].id;
                } else {
                    return value.map(text => allModifiedWords.find(word => word.text === text)?.id);
                }
            })
            .catch(() => Promise.resolve(0));
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

    protected async setMemberGroupIds(
        word: Word,
        groupIds: number[],
        selectionMode: SelectionMode = SelectionMode.Replace
    ): Promise<number> {
        let newMemberGroupIds;

        switch (selectionMode) {
            case SelectionMode.Replace:
                newMemberGroupIds = groupIds;
                break;

            case SelectionMode.Add:
                newMemberGroupIds = [...new Set([...word.memberGroupIds, ...groupIds])];
                break;

            case SelectionMode.Remove:
                newMemberGroupIds = word.memberGroupIds.filter(id => !groupIds.includes(id));
                break;
        }

        return this.table.update(word.id, { memberGroupIds: newMemberGroupIds });
    }
}
