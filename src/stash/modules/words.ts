import { db, Word, WordArchived, GroupDisplayMode } from '@/api/db';
import {
    areArraysEqual,
    exceptArray,
    intersectArrays,
    reduceArrayToObject,
    unionArrays,
    updateArrayWithValues,
    UpdateMode,
    wrapInArray
} from '@/util';
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

        // re-select previously selected words
        this.setSelectedIds(intersectArrays(selectedWordIds, this.getAllIds()));
    }

    private async getIdsByText(values: string[]): Promise<number[]> {
        const activeJournalId = this.getActiveJournal().id;

        return this.table
            .where('text')
            .anyOf(values)
            .filter(word => word.journalId === activeJournalId) // filter by active journal
            .primaryKeys();
    }

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
    async add(value: string | string[], allowLinking: boolean = true): Promise<(number | undefined)[]> {
        const activeJournalId = this.getActiveJournal().id;

        const selectedGroupIds = this.$stash.groups.selectedIds;
        if (selectedGroupIds.length === 0)
            throw new Error(`words/new: Can create new words -- no groups are selected.`);

        // always add any new words to the selected groups
        const newWordIds = await this.new(value, selectedGroupIds, activeJournalId);
        if (!allowLinking) return newWordIds;

        // if linking is allowed, run the set again and link any existing words to the selected groups
        const linkedWordIds = await this.link(value, selectedGroupIds, activeJournalId);
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
    protected async new(
        value: string | string[],
        groupIds: number[],
        activeJournalId: number
    ): Promise<(number | undefined)[]> {
        const values = this.sanitizeWordTexts(value);

        const newWordIds = db.transaction('rw', this.table, async () => {
            // get texts of all the words in this active journal
            const existingWordTexts = (await this.table
                .orderBy('text')
                .filter(word => word.journalId === activeJournalId)
                .keys()) as string[];

            // filter out existing text values from the supplied ones
            const newWordTexts = exceptArray(values, existingWordTexts);

            // add new words to the table
            const newWordIds = await this.table.bulkAdd(
                newWordTexts.map(text => new Word(text, activeJournalId, groupIds)),
                { allKeys: true }
            );

            // fetch newly added words from the db to map their ids/texts for the return value
            const newWords = await this.table.bulkGet(newWordIds);

            // this will add new words to the state
            await this.fetchGroupWords();

            // return an array of new words ids; if the text value hasn't been added, return `undefined` in the place of an id
            return wrapInArray(value).map(text => newWords.find(word => word.text === text)?.id);
        });

        this.$stash.groups.refreshWordCounts(groupIds);

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
    protected async link(
        value: string | string[],
        groupIds: number[],
        activeJournalId: number
    ): Promise<(number | undefined)[]> {
        const values = this.sanitizeWordTexts(value);

        const linkedWordIds = db.transaction('rw', this.table, async () => {
            // find existing words to map their ids/texts for the return value
            const existingWords = await this.table
                .where('text')
                .anyOf(values)
                .filter(word => word.journalId === activeJournalId)
                .toArray();

            // add `selectedGroupIds` to the existing word's groups
            await this.table
                .where('text')
                .anyOf(values)
                .filter(word => word.journalId === activeJournalId)
                .modify(word => (word.memberGroupIds = unionArrays(word.memberGroupIds, groupIds)));

            // this will update state with the modified words
            await this.fetchGroupWords();

            // return an array of new words ids; if the text value hasn't been added, return `undefined` in the place of an id
            return wrapInArray(value).map(text => existingWords.find(word => word.text === text)?.id);
        });

        this.$stash.groups.refreshWordCounts(groupIds);

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
        const allGroupIds = [...fromGroupIdList, toGroupId];

        this.$stash.groups.validateId(allGroupIds);

        this.validateId(wordIds);

        const wordIdList = wrapInArray(wordIds);

        await db.transaction('rw', this.table, async () => {
            await this.updateStateAndDb(wordIdList, 'memberGroupIds', word =>
                unionArrays(exceptArray(word.memberGroupIds, fromGroupIdList), [toGroupId])
            );

            // if words were moved to a non-selected group, these words will be removed from the state
            await this.fetchGroupWords();
        });

        this.$stash.groups.refreshWordCounts(allGroupIds);
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
        this.validateId(wordIds);
        const wordIdList = wrapInArray(wordIds);

        await db.transaction('rw', this.table, async () => {
            if (typeof value === 'boolean' && value) {
                // if no groups specified, delete from db and state
                await this.table.bulkDelete(wordIdList);
                this.removeFromAll(wordIdList);
            } else {
                // if not deleting from everywhere, delete from selected groups or supplied group ids
                const fromGroupIds = value === false ? this.$stash.groups.selectedIds : wrapInArray(value);

                // remove selected groups from the specified words
                await this.updateStateAndDb(wordIdList, 'memberGroupIds', word =>
                    exceptArray(word.memberGroupIds, fromGroupIds)
                );

                // delete orphaned words and reload words if something was deleted
                const deleteCount = await this.table.where({ memberGroupIds: [] }).delete();
                if (deleteCount > 0) await this.fetchGroupWords();
            }
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
        this.validateId(wordIds);

        const newSelectedWordIds = updateArrayWithValues(this.selectedIds, wrapInArray(wordIds), updateMode);
        if (areArraysEqual(this.state.selectedIds, newSelectedWordIds)) return;

        this.state.selectedIds = newSelectedWordIds;

        // TODO: set lookup, or update lookup or something
        // load words from the selected groups
        // await this.$stash.display.fetchGroupWords();
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
        this.validateId(wordId);
        const sanitizedText = this.sanitizeWordTexts(text).pop();
        if (!sanitizedText) throw new Error(`words/setText: String "${text}" is not valid.`);

        await this.updateStateAndDb(wordId, 'text', sanitizedText);
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
        this.validateId(wordId);

        await this.updateStateAndDb(wordId, 'isArchived', word =>
            value ?? word.isArchived === GroupDisplayMode.Active ? GroupDisplayMode.Archived : GroupDisplayMode.Active
        );
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
