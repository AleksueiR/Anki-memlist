import { Group, GroupDisplayMode, Journal, Word, WordPouch } from '@/api/db';

/**
 * Delete the existing database and populated it with the fresh set of test data.
 *
 * @export
 * @param {WordPouch} db
 * @returns {Promise<void>}
 */
export async function rePopulate(db: WordPouch): Promise<void> {
    /* await db.journals.clear();
    await db.groups.clear();
    await db.words.clear(); */

    await db.delete();
    await db.open();

    // db.on('populate', async () => {
    const journalId1 = await db.journals.add(new Journal('Second Journal'));

    const rootGroupId1 = await db.groups.add(new Group('Root group', journalId1));
    await db.journals.update(journalId1, { rootGroupId: rootGroupId1 });

    const groupIds1 = await db.groups.bulkAdd(
        [
            new Group('Group Two', journalId1, GroupDisplayMode.All, [3, 4]),
            new Group('Group Three', journalId1, GroupDisplayMode.All, [5]),
            new Group('Group Four', journalId1, GroupDisplayMode.All),
            new Group('Group Five', journalId1, GroupDisplayMode.Archived, [6]),
            new Group('Group Six', journalId1, GroupDisplayMode.Active)
        ],
        { allKeys: true }
    );

    await db.groups.update(rootGroupId1, { subGroupIds: groupIds1 });

    // create a second Journal
    const journalId2 = await db.journals.add(new Journal('Second Journal'));

    const rootGroupId2 = await db.groups.add(new Group('Root group Two', journalId2));
    await db.journals.update(journalId2, { rootGroupId: rootGroupId2 });

    const groupIds2 = await db.groups.bulkAdd(
        [new Group('Group Seven Two', journalId2), new Group('Group Eight Two', journalId2)],
        { allKeys: true }
    );
    await db.groups.update(rootGroupId2, { subGroupIds: groupIds2 });

    await db.words.bulkAdd([
        new Word('steep', journalId1, [2]), // 1
        new Word('hilarious', journalId1, [2]), // 2
        new Word('work', journalId1, [2], GroupDisplayMode.Archived), // 3
        new Word('ray', journalId1, [2], GroupDisplayMode.Archived), // 4
        new Word('youthful', journalId1, [2, 3, 5, 6]), // 5
        new Word('apparatus', journalId1, [2, 3, 4, 5, 6], GroupDisplayMode.Archived), // 6

        new Word('treasure', journalId1, [3], GroupDisplayMode.Archived), // 7
        new Word('office', journalId1, [3]), // 8
        new Word('gleaming', journalId1, [3]), // 9
        new Word('twist', journalId1, [3]), // 10
        new Word('trust', journalId1, [3]), // 11

        new Word('lace', journalId1, [4], GroupDisplayMode.Archived), // 12

        new Word('knife', journalId1, [4, 3], GroupDisplayMode.Archived), // 13
        new Word('grab', journalId1, [4, 6], GroupDisplayMode.Archived), // 14
        new Word('tan', journalId1, [4, 6], GroupDisplayMode.Archived), // 15
        new Word('eight', journalId1, [4, 5, 6], GroupDisplayMode.Archived), // 16

        new Word('bedroom', journalId1, [5]), // 17
        new Word('therapeutic', journalId1, [5, 2]), // 18
        new Word('numerous', journalId1, [5, 3]), // 19
        new Word('mushy', journalId1, [5, 4], GroupDisplayMode.Archived), // 20
        new Word('owe', journalId1, [5]), // 21

        new Word('freezing', journalId1, [6]), // 22
        new Word('second', journalId1, [6]), // 23
        new Word('unbiased', journalId1, [6]), // 24
        new Word('party', journalId1, [6]), // 25

        new Word('company', journalId2, [7, 8]), // 26
        new Word('parent', journalId2, [8]) // 27
    ]);

    // });
}
