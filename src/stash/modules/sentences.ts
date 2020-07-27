import { db, deleteSentenceInResource, getResourceSentenceIds, Sentence } from '@/api/db';
import { areArraysEqual, reduceArrayToObject, updateArrayWithValues, UpdateMode, wrapInArray } from '@/util';
import { DBCommonEntryStashModule, Stash, StashModuleState } from '../internal';

export class SentencesState extends StashModuleState<Sentence> {
    selectedIds: number[] = [];
}

export class SentencesModule extends DBCommonEntryStashModule<Sentence, SentencesState> {
    get selectedIds(): number[] {
        return this.state.selectedIds;
    }

    constructor(stash: Stash) {
        super(stash, db.sentences, SentencesState);
    }

    /**
     * Fetch `Sentence`s belonging to the selected `Resource`; if more than one selected, use the first one.
     *
     * @returns {Promise<void>}
     * @memberof SentencesModule
     */
    async fetchResourceSentences(): Promise<void> {
        this.reset();

        if (!this.activeJournal) throw new Error('sentences/fetchResourceSentences: Active journal is not set.');

        const selectedResourceId = this.$stash.resources.selectedIds.pop();
        if (!selectedResourceId) return;

        const sentenceIds = await getResourceSentenceIds(selectedResourceId);
        const sentences = await this.table.bulkGet(sentenceIds);

        this.state.all = reduceArrayToObject(sentences);
    }

    /**
     * Create new `Sentences`s in the active `Journal`.
     * Return the ids of the new `Sentence`s.
     *
     * @param {string[]} texts
     * @returns {Promise<number[]>}
     * @memberof SentencesModule
     */
    async new(texts: string[]): Promise<number[]> {
        const activeJournalId = this.activeJournal?.id;
        if (!activeJournalId) throw new Error('sentences/new: Active journal is not set.');

        return db.transaction('rw', this.table, async () => {
            const newSentenceIds = await this.table.bulkAdd(
                texts.map(text => new Sentence(text, activeJournalId)),
                { allKeys: true }
            );

            const newSentences = await this.table.bulkGet(newSentenceIds);
            if (newSentences.length !== texts.length) throw new Error('sentences/new: Cannot create new Sentences.');

            newSentences.forEach(newSentence => this.addToState(newSentence));

            return newSentenceIds;
        });
    }

    /**
     * Delete specified `Sentence`s from the provided `Resource`.
     *
     * @param {(number | number[])} sentenceId
     * @param {number} resourceId
     * @returns {Promise<void>}
     * @memberof SentencesModule
     */
    async delete(sentenceId: number | number[], resourceId: number): Promise<void> {
        const sentenceIdList = wrapInArray(sentenceId);
        sentenceIdList.forEach(sentenceId => {
            if (!this.isValid(sentenceId))
                throw new Error(`sentences/delete: Sentence #${sentenceId} is not valid in active journal`);
        });

        await db.transaction('rw', this.table, db.sentencesInResources, async () => {
            // delete sentences from the db
            this.table.bulkDelete(sentenceIdList);

            // delete sentence-resource links
            await Promise.all(sentenceIdList.map(sentenceId => deleteSentenceInResource(sentenceId, resourceId)));
        });

        // adjust selected ids
        await this.setSelectedIds(sentenceIdList, UpdateMode.Remove);

        // remove them from state
        sentenceIdList.forEach(sentenceId => this.deleteFromState(sentenceId));
    }

    /**
     * Set provided `Sentence` ids as selected.
     * Selection mode lets you add to, remove from, or replace the existing selection list.
     *
     * @param {(number | number[])} sentenceIds
     * @param {*} [updateMode=UpdateMode.Replace]
     * @returns {Promise<void>}
     * @memberof SentencesModule
     */
    async setSelectedIds(sentenceIds: number | number[], updateMode = UpdateMode.Replace): Promise<void> {
        const sentenceIdList = wrapInArray(sentenceIds);

        sentenceIdList.forEach(sentenceId => {
            if (!this.isValid(sentenceId))
                throw new Error(`sentences/setSelectedIds: Sentence #${sentenceId} is valid.`);
        });

        const newSelectedSentenceIds = updateArrayWithValues(this.selectedIds, sentenceIdList, updateMode);
        if (areArraysEqual(this.state.selectedIds, newSelectedSentenceIds)) return;

        this.state.selectedIds = newSelectedSentenceIds;
    }
}
