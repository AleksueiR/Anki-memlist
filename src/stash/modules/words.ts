import { db, Word, WordArchived } from '@/api/db';
import { exceptArray, reduceArrayToObject, unionArrays, wrapInArray, intersectArrays } from '@/util';
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

    get selectedIds(): number[] {
        return this.state.selectedIds;
    }

    /**
     * Fetch words belonging to the currently active groups.
     * Return 0 if active journal is not set.
     *
     * @returns {(Promise<void>)}
     * @memberof WordsModule
     */
    async fetchGroupWords(): Promise<void> {
        const selectedWordIds = this.selectedIds;

        this.reset(); // remove any previously loaded words

        const activeJournal = this.getActiveJournal();
        const selectedGroupIds = this.$stash.groups.selectedIds;

        const words = await this.table
            .where('memberGroupIds')
            .anyOf(selectedGroupIds)
            .filter(word => word.journalId === activeJournal.id)
            .distinct()
            .toArray();

        const wordSet = reduceArrayToObject(words);

        this.setAll(wordSet);

        // TODO: re-select previously selected words
        // this.setSelectedIds(intersectArrays(selectedWordIds, this.getAllIds()));
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

        const selectedGroupIds = this.$stash.groups.selectedIds; // assume these ids are valid and they don't contain Root Group
        if (selectedGroupIds.length === 0) return log.warn('words/new: No groups are selected'), 0;

        return db
            .transaction('rw', this.table, async () => {
                // TODO: break up to remove side-effects
                // TODO: creating new words should not by default link words in other lists

                // find existing words
                const existingWords = await this.table
                    .where('text')
                    .anyOf(values)
                    .filter(word => word.journalId === activeJournal.id) // filter by active journal
                    .toArray();

                // update existing words with new group ids
                // TODO: `setMemberGroupIds` is removed
                /* const setMemberGroupIdsResult = await Promise.all(
                    existingWords.map(word => this.setMemberGroupIds(word, selectedGroupIds, SelectionMode.Add))
                );
                // something broke, abort the transaction
                if (setMemberGroupIdsResult.includes(0)) return Dexie.currentTransaction.abort(), 0; */

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
        const vettedFromGroupIds = this.$stash.groups.vetId(fromGroupIds, true);
        if (vettedFromGroupIds.length === 0) return log.warn(`words/move: All "fromGroup" ids are invalid.`), 0;

        // check that `toGroup` id is valid
        if (!this.$stash.groups.isValidId(toGroupId, true))
            return log.warn(`words/move: The "toGroup" id is invalid.`), 0;

        const vettedWordIds = this.vetId(wordIds);
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
     * Delete specified word ids from the provided groups.
     * If no group ids are provided, delete words from the journal.
     *
     * @param {(number | number[])} wordIds
     * @param {(number | number[])} [fromGroupIds]
     * @returns {Promise<void>}
     * @memberof WordsModule
     */
    async delete(wordIds: number | number[], fromGroupIds?: number | number[]): Promise<void> {
        this.validateId(wordIds);
        this.$stash.groups.validateId(fromGroupIds || []);

        const wordIdList = wrapInArray(wordIds);

        await db.transaction('rw', this.table, async () => {
            if (fromGroupIds === undefined) {
                console.log('I shouldnt be called');

                // if no groups specified, delete from everywhere
                await this.table.bulkDelete(wordIdList);
                this.removeFromAll(wordIdList);
            } else {
                // remove `fromGroupIds` from the specified words
                await this.updateStateAndDb(wordIdList, 'memberGroupIds', word =>
                    exceptArray(word.memberGroupIds, wrapInArray(fromGroupIds))
                );

                // TODO: remove orphaned words
            }

            // reload all the group words
            // this will add new words to the state and also reload existing words that were added to the active groups
            await this.fetchGroupWords();
        });

        this.$stash.groups.refreshWordCounts();
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
        const activeJournal = this.getActiveJournal();

        return this.table
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
    // NOTE: I dno't think this is needed at all; there is no use case for it
    /* protected async setMemberGroupIds(
        word: Word,
        groupIds: number | number[],
        selectionMode: SelectionMode = SelectionMode.Replace
    ): Promise<number> {
        this.validateId(groupIds);
        const groupIdList = wrapInArray(groupIds);

        let newMemberGroupIds;

        switch (selectionMode) {
            case SelectionMode.Replace:
                newMemberGroupIds = groupIdList;
                break;

            case SelectionMode.Add:
                // remove duplicate
                newMemberGroupIds = [...new Set([...word.memberGroupIds, ...groupIdList])];
                break;

            case SelectionMode.Remove:
                // remove existing ids with the provided ids
                newMemberGroupIds = word.memberGroupIds.filter(id => !groupIdList.includes(id));
                break;

            default:
                throw new Error(`words/setMemberGroupIds: Unknown code ${selectionMode}.`);
        }

        return this.updateStateAndDb(word.id, 'memberGroupIds', newMemberGroupIds);
    } */

    async vetIdAgainstDb(ids: number | number[]): Promise<number[]> {
        const activeJournal = this.getActiveJournal();

        return this.table
            .where('id')
            .anyOf(wrapInArray(ids))
            .filter(word => word.journalId === activeJournal?.id)
            .primaryKeys();
    }
}
