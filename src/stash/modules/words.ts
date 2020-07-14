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

    private async getIdsByText(values: string[]): Promise<number[]> {
        return this.table
            .where('text')
            .anyOf(values)
            .filter(word => word.journalId === this.getActiveJournal()?.id) // filter by active journal
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
                .orderBy('text')
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
