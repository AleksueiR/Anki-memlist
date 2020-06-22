import { Group, GroupDisplayMode, Journal, Word, WordPouch } from '@/api/db';

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
        new Word('steep', journalId1, [2]),
        new Word('hilarious', journalId1, [2]),
        new Word('work', journalId1, [2], GroupDisplayMode.Archived),
        new Word('ray', journalId1, [2], GroupDisplayMode.Archived),
        new Word('youthful', journalId1, [2, 3, 5, 6]),
        new Word('apparatus', journalId1, [2, 3, 4, 5, 6], GroupDisplayMode.Archived),

        new Word('treasure', journalId1, [3], GroupDisplayMode.Archived),
        new Word('office', journalId1, [3]),
        new Word('gleaming', journalId1, [3]),
        new Word('twist', journalId1, [3]),
        new Word('trust', journalId1, [3]),

        new Word('lace', journalId1, [4], GroupDisplayMode.Archived),

        new Word('knife', journalId1, [4, 3], GroupDisplayMode.Archived),
        new Word('grab', journalId1, [4, 6], GroupDisplayMode.Archived),
        new Word('tan', journalId1, [4, 6], GroupDisplayMode.Archived),
        new Word('eight', journalId1, [4, 5, 6], GroupDisplayMode.Archived),

        new Word('bedroom', journalId1, [5]),
        new Word('therapeutic', journalId1, [5, 2]),
        new Word('numerous', journalId1, [5, 3]),
        new Word('mushy', journalId1, [5, 4], GroupDisplayMode.Archived),
        new Word('owe', journalId1, [5]),

        new Word('freezing', journalId1, [6]),
        new Word('second', journalId1, [6]),
        new Word('unbiased', journalId1, [6]),
        new Word('party', journalId1, [6]),

        new Word('company', journalId2, [7, 8]),
        new Word('parent', journalId2, [8])
    ]);

    // });
}
