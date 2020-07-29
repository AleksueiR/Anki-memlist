import { db, deleteWordInGroup, getGroupWordIds, GroupDisplayMode, putWordInGroup, Word, WordArchived } from '@/api/db';
import {
    combineArrays,
    doArraysIntersect,
    exceptArray,
    intersectArrays,
    reduceArrayToObject,
    sanitizeWordTexts,
    UpdateMode,
    wrapInArray
} from '@/util';
import { CommonEntryStashState } from '../common';
import { CommonEntryStash, EntrySet, Stash } from '../internal';

export type WordSet = EntrySet<Word>;

export class WordsState extends CommonEntryStashState<Word> {}

export class WordsModule extends CommonEntryStash<Word, WordsState> {
    constructor(stash: Stash) {
        super(stash, db.words, WordsState);
    }

    /**
     * Fetch words belonging to the currently active groups.
     *
     * @returns {(Promise<void>)}
     * @memberof WordsModule
     */
    async fetchGroupWords(): Promise<void> {
        const selectedWordIds = this.selectedIds;
        const selectedGroupIds = this.$stash.groups.selectedIds;

        const wordIds = await Promise.all(
            selectedGroupIds.map(async groupId => {
                const group = this.$stash.groups.get(groupId);
                if (!group)
                    throw new Error(`words/fetchGroupWords: Group #${groupId} is not valid in the active Journal.`);

                // get word ids for this group
                const wordIds = await getGroupWordIds(group.id);

                // select only words that match this group's display mode
                const wordCollection = this.table.where('id').anyOf(wordIds);
                const filteredCollection =
                    group.displayMode === GroupDisplayMode.All
                        ? wordCollection
                        : wordCollection.filter(word => word.isArchived === group.displayMode);

                return filteredCollection.primaryKeys();
            })
        );
        const words = await this.table.bulkGet([...new Set(wordIds.flat())]);
        this.state.all = reduceArrayToObject(words);

        // re-select previously selected words
        await this.setSelectedIds(intersectArrays(selectedWordIds, this.allIds));
    }

    /**
     * Add new `Word`s to the active `Journal`.
     *
     * Returns a list of ids numbers.
     *
     * @param {(string | string[])} value
     * @returns {(Promise<number[]>)}
     * @memberof WordsModule
     */
    async new(value: string | string[]): Promise<number[]> {
        if (!this.activeJournal) throw new Error('words/new: Active journal is not set.');
        const activeJournalId = this.activeJournal.id;

        const values = wrapInArray(value);

        return db.transaction('rw', this.table, async () => {
            // add new words to the DB
            const newWordIds = await this.table.bulkAdd(
                values.map(text => new Word(text, activeJournalId)),
                { allKeys: true }
            );

            const newWords = await this.table.bulkGet(newWordIds);
            if (newWords.length !== values.length) throw new Error(`words/new: Cannot create new Words.`);

            return newWordIds;
        });
    }

    /**
     * Move a specified word (or words) from one subgroup to another.
     * Only words in the currently selected groups can be moved, but they can be moved to any other group in the journal.
     *
     *
     * @param {(number | number[])} wordIds
     * @param {(number | number[])} fromGroupIds
     * @param {number} toGroupId
     * @returns {Promise<void>}
     * @memberof WordsModule
     */
    async move(wordIds: number | number[], fromGroupIds: number | number[], toGroupId: number): Promise<void> {
        const fromGroupIdList = wrapInArray(fromGroupIds);
        const wordIdList = wrapInArray(wordIds);

        await db.transaction('rw', this.table, db.groups, db.wordsInGroups, async () => {
            if (!this.activeJournal) throw new Error('words/move: Active journal is not set.');
            if (toGroupId === this.activeJournal.rootGroupId)
                throw new Error('words/move: Cannot move words to Root Group.');

            // check that all "from" groups exist in the active journal
            // if not check, it can lead to invalid db state if the "to" group does exist
            fromGroupIdList.forEach(groupId => {
                if (!this.$stash.groups.isValid(groupId))
                    throw new Error(`words/move: Group #${groupId} does not belong to the active journal.`);
            });

            // delete all existing combinations of word and fromGroup ids
            await this.deleteWordsInGroups(wordIdList, fromGroupIdList);
            // put in new combinations of word and toGroup ids
            await this.putWordsInGroups(wordIdList, [toGroupId]);

            // if words were moved to a non-selected group, these words will be removed from the state
            if (doArraysIntersect(this.$stash.groups.selectedIds, [...fromGroupIdList, toGroupId])) {
                await this.fetchGroupWords();
            }
        });

        this.$stash.groups.refreshWordCounts([...fromGroupIdList, toGroupId]);
    }

    /**
     * Delete specified word ids from everywhere (in the active journal), the selected groups, or the supplied group ids.
     * If `false` or no value is supplied for 'deleteEverywhere' , delete from the selected groups.
     *
     * @param {(number | number[])} wordIds
     * @param {(number | number[] | boolean)} [value=false]
     * @returns {Promise<void>}
     * @memberof WordsModule
     */
    async delete(wordIds: number | number[], deleteEverywhere?: boolean): Promise<void>;
    async delete(wordIds: number | number[], fromGroupIds: number | number[]): Promise<void>;
    async delete(wordIds: number | number[], value: number | number[] | boolean = false): Promise<void> {
        const wordIdList = wrapInArray(wordIds);
        const selectedGroupIds = this.$stash.groups.selectedIds;

        let refreshGroupIds: number[] | undefined;

        await db.transaction('rw', this.table, db.groups, db.wordsInGroups, async () => {
            if (!this.activeJournal) throw new Error('words/delete: Active journal is not set.');

            // check that all word ids exist in the db
            await Promise.all(
                wordIdList.map(async wordId => {
                    if (!(await this.isValidInDb(wordId)))
                        throw new Error(`words/delete: Word #${wordId} does not belong to the active journal.`);
                })
            );

            if (typeof value === 'boolean' && value) {
                // if no groups specified, delete from db
                await this.table.bulkDelete(wordIdList);
                await db.wordsInGroups
                    .where('wordId')
                    .anyOf(wordIdList)
                    .delete();
            } else {
                // if not deleting from everywhere, delete from selected groups or supplied group ids
                const fromGroupIds = value === false ? selectedGroupIds : wrapInArray(value);

                // remove selected groups from the specified words
                await this.deleteWordsInGroups(wordIdList, fromGroupIds);

                // delete orphaned words left after removed words from group and reload words if something was deleted
                const nonOrphanedWords = (await db.wordsInGroups
                    .where('wordId')
                    .anyOf(wordIdList)
                    .keys()) as number[];

                const orphanedWords = exceptArray(wordIdList, nonOrphanedWords);
                await this.table.bulkDelete(orphanedWords);

                // refresh word count only in the subset of selected groups
                refreshGroupIds = intersectArrays(fromGroupIds, selectedGroupIds);
            }

            // refresh word pool if some of the groups manipulated are selected ids
            if (!refreshGroupIds || doArraysIntersect(selectedGroupIds, refreshGroupIds)) {
                await this.fetchGroupWords();
            }
        });

        this.$stash.groups.refreshWordCounts(refreshGroupIds);
    }

    /**
     * Set provided `Word` ids as selected.
     * Selection mode lets you add to, remove from, or replace the existing selection list.
     *
     * @param {(number | number[])} wordIds
     * @param {*} [updateMode=UpdateMode.Replace]
     * @returns {(Promise<void | 0>)}
     * @memberof WordsModule
     */
    async setSelectedIds(wordIds: number | number[], updateMode = UpdateMode.Replace): Promise<void | 0> {
        super.setSelectedIds(wordIds, updateMode);

        // TODO: trigger lookup [?]
    }

    /**
     * Set text of the given word to the provided value.
     *
     * @param {number} wordId
     * @param {string} text
     * @returns {Promise<number>}
     * @memberof WordsModule
     */
    async setText(wordId: number, text: string): Promise<number> {
        if (!this.isValidInDb(wordId))
            throw new Error(`words/setText: Word #${wordId} does not belong to the active journal.`);

        const sanitizedText = sanitizeWordTexts(text).pop();
        if (!sanitizedText) throw new Error(`words/setText: String "${text}" is not valid.`);

        return this.updateStateAndDb(wordId, 'text', sanitizedText);
    }

    /**
     * Set `isArchived` flag of the given word to the provided value.
     * If no value is provided, the archived status is toggled.
     *
     * @param {number} wordId
     * @param {WordArchived} [value]
     * @returns {Promise<void>}
     * @memberof WordsModule
     */
    async setIsArchived(wordId: number, value?: WordArchived): Promise<number> {
        if (!this.isValidInDb(wordId))
            throw new Error(`words/setIsArchived: Word #${wordId} does not belong to the active journal.`);

        return this.updateStateAndDb(wordId, 'isArchived', word =>
            value ?? word.isArchived === GroupDisplayMode.Active ? GroupDisplayMode.Archived : GroupDisplayMode.Active
        );
    }

    /**
     * Given a list of word texts and a `Journal` id, return a tuple of new and duplicate word texts belonging to this `Journal`.
     *
     * @param {(string | string[])} value
     * @param {number} journalId
     * @returns {Promise<[string[], string[]]>}
     * @memberof WordsModule
     */
    async findDuplicateWords(value: string | string[], journalId: number): Promise<[string[], string[]]> {
        const values = wrapInArray(value);

        const existingWordTexts = (await this.table
            .where('text')
            .anyOf(values)
            .filter(word => word.journalId === journalId)
            .keys()) as string[];

        // filter out existing text values from the supplied ones
        const newWordTexts = exceptArray(values, existingWordTexts);

        return [newWordTexts, existingWordTexts];
    }

    /**
     * Put provided words into the supplied groups.
     *
     * @param {number[]} wordIds
     * @param {number[]} groupIds
     * @returns {Promise<void[]>}
     * @memberof WordsModule
     */
    async putWordsInGroups(wordIds: number[], groupIds: number[]): Promise<void> {
        const activeJournalId = this.activeJournal?.id;
        if (!activeJournalId) throw new Error('words/putWordsInGroups: Active journal is not set.');

        const wordGroupIdPairs = combineArrays(wordIds, groupIds);

        await db.transaction('rw', this.table, db.groups, db.wordsInGroups, () => {
            return Promise.all(
                wordGroupIdPairs.map(([wordId, groupId]) => putWordInGroup(wordId, groupId, activeJournalId))
            );
        });

        // re-fetch words if one of the specified groups is selected
        if (doArraysIntersect(this.$stash.groups.selectedIds, groupIds)) {
            await this.fetchGroupWords();
        }
    }

    /**
     * Delete provided word from the supplied groups.
     *
     * @param {number[]} wordIds
     * @param {number[]} groupIds
     * @memberof WordsModule
     */
    async deleteWordsInGroups(wordIds: number[], groupIds: number[]): Promise<void> {
        const wordGroupIdPairs = combineArrays(wordIds, groupIds);

        await Promise.all(wordGroupIdPairs.map(pair => deleteWordInGroup(...pair)));

        // re-fetch words if one of the specified groups is selected id
        if (doArraysIntersect(this.$stash.groups.selectedIds, groupIds)) {
            await this.fetchGroupWords();
        }
    }
}
