import { db, Word, WordArchived } from '@/api/db';
import { exceptArray, reduceArrayToObject, unionArrays, wrapInArray } from '@/util';
import Dexie from 'dexie';
import log from 'loglevel';
import { EntrySet, NonJournalStashModule, SelectionMode, Stash, StashModuleState } from '../internal';

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
     * Add a new word or link an existing word to the selected groups.
     *
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

                // update existing words with new group ids
                const setMemberGroupIdsResult = await Promise.all(
                    existingWords.map(word => this.setMemberGroupIds(word, selectedGroupIds, SelectionMode.Add))
                );
                // something broke, abort the transaction
                if (setMemberGroupIdsResult.includes(0)) return Dexie.currentTransaction.abort(), 0;

                // filter down to new words
                const existingWordsTexts = existingWords.map(word => word.text);
                const newTexts = values.filter(text => !existingWordsTexts.includes(text));

                let newWordIds: number[] = [];
                let newWords: Word[] = [];

                // if there are any new words
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
                }

                // reload all the group words
                // this will add new words to the state and also reload existing words that were added to the active groups
                await this.fetchGroupWords();
                await this.$stash.groups.refreshWordCounts(selectedGroupIds);

                const allModifiedWords = [...newWords, ...existingWords];

                // if only a single word was provided and we have more modified words, something went wrong
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
     * Move a specified word (or words) from one subgroup to another.
     * Only words in the currently selected groups can be moved, but they can be moved to any other group in the journal.
     *
     * @param {(number | number[])} wordIds
     * @param {(number | number[])} fromGroupIds
     * @param {number} toGroupId
     * @returns {(Promise<void | 0>)}
     * @memberof WordsModule
     */
    async move(wordIds: number | number[], fromGroupIds: number | number[], toGroupId: number): Promise<void | 0> {
        // check if there is at least a single `fromGroup` id that is valid
        const vettedFromGroupIds = this.$stash.groups.vetIds(fromGroupIds, true);
        if (vettedFromGroupIds.length === 0) return log.warn(`words/move: All "fromGroup" ids are invalid.`), 0;

        // check that `fromGroup` ids belong to selected groups
        if (vettedFromGroupIds.some(id => !this.$stash.groups.selectedIds.includes(id)))
            return log.warn(`words/move: Moving from a non-selected groups ${vettedFromGroupIds} is not allowed.`), 0;

        // check that `toGroup` id is valid
        if (!this.$stash.groups.isValidId(toGroupId, true))
            return log.warn(`words/move: The "toGroup" id is invalid.`), 0;

        const vettedWordIds = this.vetIds(wordIds);
        if (vettedWordIds.length === 0) return log.warn(`words/move: All word ids are invalid.`), 0;

        return db.transaction('rw', this.table, async () => {
            const updateStateResult = await Promise.all(
                vettedWordIds.map(async wordId => {
                    const word = this.get(wordId);
                    if (!word) return 0;

                    // calculate new memberGroupIds for a given words and update state/db
                    const newMemberGroupIds = unionArrays(exceptArray(word.memberGroupIds, vettedFromGroupIds), [
                        toGroupId
                    ]);
                    return this.updateStateAndDb(wordId, 'memberGroupIds', newMemberGroupIds);
                })
            );

            // if at least one result fails, abort the transaction
            if (updateStateResult.includes(0)) return Dexie.currentTransaction.abort(), 0;

            // reload all the group words
            // this will add new words to the state and also reload existing words that were added to the active groups
            await this.fetchGroupWords();
            await this.$stash.groups.refreshWordCounts([...vettedFromGroupIds, toGroupId]);
        });
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
     * Set the memberGroupIds list of the give word object.
     *
     * @protected
     * @param {Word} word
     * @param {number[]} groupIds
     * @param {SelectionMode} [selectionMode=SelectionMode.Replace]
     * @returns {Promise<number>}
     * @memberof WordsModule
     */
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
                // remove duplicate
                newMemberGroupIds = [...new Set([...word.memberGroupIds, ...groupIds])];
                break;

            case SelectionMode.Remove:
                // remove existing ids with the provided ids
                newMemberGroupIds = word.memberGroupIds.filter(id => !groupIds.includes(id));
                break;

            default:
                log.warn(`words/setMemberGroupIds: Unknown code ${selectionMode}.`);
                return 0;
        }

        return this.table.update(word.id, { memberGroupIds: newMemberGroupIds });
    }
}
