import {
    putWordInGroup,
    db,
    getGroupWordIds,
    GroupDisplayMode,
    isValidDBCommonEntry,
    Word,
    WordArchived,
    deleteWordInGroup,
    WordInGroup
} from '@/api/db';
import { combineArrays, exceptArray, intersectArrays, UpdateMode, wrapInArray } from '@/util';
import { CommonStashModule, EntrySet, Stash, StashModuleState } from '../internal';

export type WordSet = EntrySet<Word>;

export class WordsState extends StashModuleState<Word> {
    selectedIds: number[] = [];
}

export class WordsModule extends CommonStashModule<Word, WordsState> {
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

        const selectedGroupIds = this.$stash.groups.selectedIds;

        const wordLists = await Promise.all(
            selectedGroupIds.map(async groupId => {
                const group = this.$stash.groups.get(groupId);
                if (!group) throw new Error(`words/fetchGroupWords: Group #${groupId} is not valid in active journal.`);

                // get word ids for this group
                const wordIds = await getGroupWordIds(group.id);

                // select only words that match this group's display mode
                const wordCollection = db.words.where('id').anyOf(wordIds);
                const filteredCollection =
                    group.displayMode === GroupDisplayMode.All
                        ? wordCollection
                        : wordCollection.filter(word => word.isArchived === group.displayMode);

                return filteredCollection.toArray();
            })
        );

        wordLists.flat().forEach(word => {
            if (!this.has(word.id)) this.add(word);
        });

        // re-select previously selected words
        this.setSelectedIds(intersectArrays(selectedWordIds, this.state.allIds));
    }

    /*     private async getIdsByText(values: string[]): Promise<number[]> {
        const activeJournalId = this.getActiveJournal().id;

        return this.table
            .where('text')
            .anyOf(values)
            .filter(word => word.journalId === activeJournalId) // filter by active journal
            .primaryKeys();
    } */

    /**
     * Add a new word or link an existing word to the selected groups.
     *
     * Returns a list of ids numbers or `undefined`s corresponding to the list of text values provided.
     *
     * @param {(string | string[])} value
     * @param {boolean} [allowLinking=true]
     * @returns {(Promise<(number | undefined)[]>)}
     * @memberof WordsModule
     */
    async newOrLink(value: string | string[], allowLinking: boolean = true): Promise<(number | undefined)[]> {
        // if linking is allowed, run the set again and link any existing words to the selected groups
        const linkedWordIds = allowLinking
            ? await this.link(value)
            : new Array(wrapInArray(value).length).fill(undefined);

        // always add any new words to the selected groups
        const newWordIds = await this.new(value);

        // merge results of both linking and creating new words and return
        return newWordIds.map((id, index) => id ?? linkedWordIds[index]);
    }

    /**
     * Add a new word to the selected groups.
     *
     * Returns a list of ids numbers or `undefined`s corresponding to the list of text values provided.
     *
     * @protected
     * @param {(string | string[])} value
     * @param {number[]} groupIds
     * @returns {(Promise<(number | undefined)[]>)}
     * @memberof WordsModule
     */
    protected async new(value: string | string[]): Promise<(number | undefined)[]> {
        const values = this.sanitizeWordTexts(value);

        if (!this.activeJournal) throw new Error('words/new: Active journal is not set.');
        const activeJournalId = this.activeJournal.id;

        const selectedGroupIds = this.$stash.groups.selectedIds;
        if (selectedGroupIds.length === 0)
            throw new Error(`words/new: Cannot create new words -- no groups are selected.`);

        const newWordIds = db.transaction('rw', this.table, db.groups, db.wordsInGroups, async () => {
            // get texts of all the words in the active journal
            const existingWordTexts = (await this.table
                .orderBy('text')
                .filter(word => word.journalId === activeJournalId)
                .keys()) as string[];

            // filter out existing text values from the supplied ones
            const newWordTexts = exceptArray(values, existingWordTexts);

            // add new words to the table
            const newWordIds = await this.table.bulkAdd(
                newWordTexts.map(text => new Word(text, activeJournalId, [])),
                { allKeys: true }
            );

            // if no new words detected, return all undefined
            if (newWordIds.length === 0) return new Array(wrapInArray(value).length).fill(undefined);

            // put the new combinations between word and group ids into the db
            await this.putWordsInGroups(newWordIds, selectedGroupIds, activeJournalId);

            // this will add new words to the state
            await this.fetchGroupWords();

            // return an array of new words ids; if the text value hasn't been added, return `undefined` in the place of an id
            return wrapInArray(value).map(text => {
                const index = newWordTexts.findIndex(newWordText => newWordText === text);
                return newWordIds[index];
            });
        });

        this.$stash.groups.refreshWordCounts(selectedGroupIds);

        return newWordIds;
    }

    /**
     * Link an existing word to the selected groups.
     *
     * Returns a list of ids numbers or `undefined`s corresponding to the list of text values provided.
     *
     * @protected
     * @param {(string | string[])} value
     * @param {number[]} groupIds
     * @returns {(Promise<(number | undefined)[]>)}
     * @memberof WordsModule
     */
    protected async link(value: string | string[]): Promise<(number | undefined)[]> {
        const values = this.sanitizeWordTexts(value);

        const selectedGroupIds = this.$stash.groups.selectedIds;
        if (selectedGroupIds.length === 0)
            throw new Error(`words/link: Can create new words -- no groups are selected.`);

        if (!this.activeJournal) throw new Error('words/link: Active journal is not set.');
        const activeJournalId = this.activeJournal.id;

        const linkedWordIds = db.transaction('rw', this.table, db.groups, db.wordsInGroups, async () => {
            // find existing words to map their ids/texts for the return value
            const existingWords = await this.table
                .where('text')
                .anyOf(values)
                .filter(word => word.journalId === activeJournalId)
                .toArray();

            // if no existing words found, return an array of undefined
            if (existingWords.length === 0) return new Array(wrapInArray(value).length).fill(undefined);

            const existingWordIds = existingWords.map(({ id }) => id);

            // put the new combinations between word and group ids into the db
            await this.putWordsInGroups(existingWordIds, selectedGroupIds, activeJournalId);

            // this will update state with the modified words
            await this.fetchGroupWords();

            // return an array of new words ids; if the text value hasn't been added, return `undefined` in the place of an id
            return wrapInArray(value).map(text => existingWords.find(word => word.text === text)?.id);
        });

        this.$stash.groups.refreshWordCounts(selectedGroupIds);

        return linkedWordIds;
    }

    /**
     * Move a specified word (or words) from one subgroup to another.
     * Only words in the currently selected groups can be moved, but they can be moved to any other group in the journal.
     *
     * @param {(number | number[])} wordIds
     * @param {(number | number[])} fromGroupIds
     * @param {number} toGroupId
     * @returns {(Promise<void>)}
     * @memberof WordsModule
     */
    async move(wordIds: number | number[], fromGroupIds: number | number[], toGroupId: number): Promise<void> {
        const fromGroupIdList = wrapInArray(fromGroupIds);
        const wordIdList = wrapInArray(wordIds);

        await db.transaction('rw', this.table, db.groups, db.wordsInGroups, async () => {
            if (!this.activeJournal) throw new Error('words/move: Active journal is not set.');
            if (toGroupId === this.activeJournal?.rootGroupId)
                throw new Error('words/move: Cannot move words to Root Group.');

            // delete all existing combinations of word and fromGroup ids
            await this.deleteWordsInGroups(wordIdList, fromGroupIdList);
            // put in new combinations of word and toGroup ids
            await this.putWordsInGroups(wordIdList, [toGroupId], this.activeJournal.id);

            // if words were moved to a non-selected group, these words will be removed from the state
            await this.fetchGroupWords();
        });

        this.$stash.groups.refreshWordCounts([...fromGroupIdList, toGroupId]);
    }

    /**
     * Delete specified word ids from everywhere (the journal), the selected groups, or the supplied group ids.
     * If no value is supplied, delete from the selected groups.
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

        await db.transaction('rw', this.table, db.groups, db.wordsInGroups, async () => {
            if (!this.activeJournal) throw new Error('words/delete: Active journal is not set.');
            // check that words belong to this journal

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
                const fromGroupIds = value === false ? this.$stash.groups.selectedIds : wrapInArray(value);

                // remove selected groups from the specified words
                await this.deleteWordsInGroups(wordIdList, fromGroupIds);

                // delete orphaned words and reload words if something was deleted
                const allWordIds = await this.table.where({ journalId: this.activeJournal.id }).primaryKeys();
                const allWordsInGroupIds = await db.wordsInGroups
                    .where('wordId')
                    .anyOf(allWordIds)
                    .distinct()
                    .primaryKeys();

                const wordIdsToDelete = exceptArray(
                    allWordIds,
                    allWordsInGroupIds.map(([wordId]) => wordId)
                );
                await this.table.bulkDelete(wordIdsToDelete);
            }

            this.fetchGroupWords();
        });

        this.$stash.groups.refreshWordCounts();
    }

    /**
     * Set provided word ids as selected.
     * Selection mode lets you add to, remove from, or replace the existing selection list.
     *
     * @param {(number | number[])} wordIds
     * @param {*} [updateMode=UpdateMode.Replace]
     * @returns {Promise<void>}
     * @memberof WordsModule
     */
    async setSelectedIds(wordIds: number | number[], updateMode = UpdateMode.Replace): Promise<void> {
        /* this.isValidId(wordIds);

        const newSelectedWordIds = updateArrayWithValues(this.selectedIds, wrapInArray(wordIds), updateMode);
        if (areArraysEqual(this.state.selectedIds, newSelectedWordIds)) return;

        this.state.selectedIds = newSelectedWordIds;

        // TODO: set lookup, or update lookup or something
        // load words from the selected groups
        // await this.$stash.display.fetchGroupWords(); */
    }

    /**
     * Set text of the given word to the provided value.
     *
     * @param {number} wordId
     * @param {string} text
     * @returns {Promise<void>}
     * @memberof WordsModule
     */
    async setText(wordId: number, text: string): Promise<void> {
        /* this.isValidId(wordId);
        const sanitizedText = this.sanitizeWordTexts(text).pop();
        if (!sanitizedText) throw new Error(`words/setText: String "${text}" is not valid.`);

        await this.updateStateAndDb(wordId, 'text', sanitizedText); */
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
    async setIsArchived(wordId: number, value?: WordArchived): Promise<void> {
        /* this.isValidId(wordId);

        await this.updateStateAndDb(wordId, 'isArchived', word =>
            value ?? word.isArchived === GroupDisplayMode.Active ? GroupDisplayMode.Archived : GroupDisplayMode.Active
        ); */
    }

    private async putWordsInGroups(existingWordIds: number[], selectedGroupIds: number[], activeJournalId: number) {
        const wordGroupIdPairs = combineArrays(existingWordIds, selectedGroupIds);

        const promises = wordGroupIdPairs.map(async ([wordId, groupId]) =>
            putWordInGroup(wordId, groupId, activeJournalId)
        );

        await Promise.all(promises);
    }

    private async deleteWordsInGroups(existingWordIds: number[], selectedGroupIds: number[]) {
        const wordGroupIdPairs = combineArrays(existingWordIds, selectedGroupIds);

        const promises = wordGroupIdPairs.map(async ([wordId, groupId]) => deleteWordInGroup(wordId, groupId));

        await Promise.all(promises);
    }

    /**
     * Sanitize the text values provided for creating new or linking existing words.
     *
     * @private
     * @param {(string | string[])} value
     * @returns {string[]}
     * @memberof WordsModule
     */
    private sanitizeWordTexts(value: string | string[]): string[] {
        let values = wrapInArray(value)
            .map(text => text.trim().toLocaleLowerCase())
            .filter(text => text !== '');

        return [...new Set(values)]; // remove duplicates
    }
}
