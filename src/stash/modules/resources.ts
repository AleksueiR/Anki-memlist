import { db, getResourceSentenceIds, Resource } from '@/api/db';
import { intersectArrays, reduceArrayToObject, UpdateMode, wrapInArray } from '@/util';
import { CommonEntryStashState } from '../common';
import { CommonEntryStash, Stash } from '../internal';

export class ResourcesState extends CommonEntryStashState<Resource> {}

export class ResourcesModule extends CommonEntryStash<Resource, ResourcesState> {
    constructor(stash: Stash) {
        super(stash, db.resources, ResourcesState);
    }

    /**
     * Fetch `Resource`s belonging to the currently active `Journal`.
     *
     * @returns {Promise<void>}
     * @memberof ResourcesModule
     */
    async fetchJournalResources(): Promise<void> {
        if (!this.activeJournal) throw new Error('resources/fetchJournalResources: Active journal is not set.');

        const resources = await this.table.where({ journalId: this.activeJournal.id }).toArray();

        this.state.all = reduceArrayToObject(resources);

        // re-select previously selected resources
        await this.setSelectedIds(intersectArrays(this.selectedIds, this.allIds));
    }

    /**
     * Create a new `Resource` in the active `Journal`.
     * Return the id of the new `Resource`.
     *
     * @param {string} name
     * @param {string[]} sentences
     * @returns {Promise<number>}
     * @memberof ResourcesModule
     */
    async new(name: string): Promise<number> {
        return db.transaction('rw', this.table, async () => {
            if (!this.activeJournal) throw new Error('groups/new: Active journal is not set.');

            // create a new group entry
            const newResourceId = await this.table.put(new Resource(name, this.activeJournal.id, 1));
            const newResource = await this.table.get(newResourceId);
            if (!newResource) throw new Error('resources/new: Cannot create a new Resource.');

            // add resource to the state
            this.addToAll(newResource);

            return newResource.id;
        });
    }

    /**
     * Delete specified `Resource`s.
     *
     * @param {(number | number[])} resourceIds
     * @returns {Promise<void>}
     * @memberof ResourcesModule
     */
    async delete(resourceIds: number | number[]): Promise<void> {
        const resourceIdList = wrapInArray(resourceIds);
        resourceIdList.forEach(resourceId => {
            if (!this.isValid(resourceId))
                throw new Error(`resources/delete: Resource #${resourceId} is not valid in active journal`);
        });

        await db.transaction('rw', this.table, db.sentences, db.sentencesInResources, async () => {
            await Promise.all(
                resourceIdList.map(async resourceId => {
                    // get sentence ids for this resource
                    const sentenceIds = await getResourceSentenceIds(resourceId);

                    this.$stash.sentences.delete(sentenceIds);
                })
            );

            // delete resources from the db
            await this.table.bulkDelete(resourceIdList);
        });

        await this.fetchJournalResources();
    }

    /**
     * Set provided `Resource` ids as selected.
     * Selection mode lets you add to, remove from, or replace the existing selection list.
     *
     * @param {(number | number[])} resourceIds
     * @param {*} [updateMode=UpdateMode.Replace]
     * @returns {(Promise<void | 0>)}
     * @memberof ResourcesModule
     */
    async setSelectedIds(resourceIds: number | number[], updateMode = UpdateMode.Replace): Promise<void | 0> {
        if ((await super.setSelectedIds(resourceIds, updateMode)) === 0) return 0;

        await this.$stash.sentences.fetchResourceSentences();
    }

    /**
     * Set name of the specified `Resource`.
     *
     * @param {number} resourceId
     * @param {string} name
     * @returns {Promise<number>}
     * @memberof ResourcesModule
     */
    async setName(resourceId: number, name: string): Promise<number> {
        if (!this.isValid(resourceId)) throw new Error(`resources/setName: Resource #${resourceId} is not valid.`);

        return this.updateStateAndDb(resourceId, 'name', name);
    }

    async putResourcesInGroups(resourceIds: number[], groupId: number): Promise<void> {}
}
