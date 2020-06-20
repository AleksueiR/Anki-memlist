import { Group, GroupDisplayMode, Journal, Word, WordPouch } from '@/api/db';

export async function rePopulate(db: WordPouch): Promise<void> {
    /* await db.journals.clear();
    await db.groups.clear();
    await db.words.clear(); */

    await db.delete();
    await db.open();

    // db.on('populate', async () => {
    const journalId = await db.journals.add(new Journal('Default Journal'));

    const rootGroupId = await db.groups.add(new Group('Root group', journalId));
    await db.journals.update(journalId, { rootGroupId: rootGroupId });

    const groupIds = await db.groups.bulkAdd(
        [
            new Group('Group Two', journalId),
            new Group('Group Three', journalId),
            new Group('Group Four', journalId),
            new Group('Group Five', journalId, GroupDisplayMode.Archived),
            new Group('Group Six', journalId, GroupDisplayMode.Active)
        ],
        { allKeys: true }
    );

    await db.groups.update(rootGroupId, { subGroupIds: groupIds });

    await db.words.bulkAdd([
        new Word('steep', journalId, [2]),
        new Word('hilarious', journalId, [2]),
        new Word('work', journalId, [2], GroupDisplayMode.Archived),
        new Word('ray', journalId, [2], GroupDisplayMode.Archived),
        new Word('youthful', journalId, [2, 3, 5, 6]),
        new Word('apparatus', journalId, [2, 3, 4, 5, 6], GroupDisplayMode.Archived),

        new Word('treasure', journalId, [3], GroupDisplayMode.Archived),
        new Word('office', journalId, [3]),
        new Word('gleaming', journalId, [3]),
        new Word('twist', journalId, [3]),
        new Word('trust', journalId, [3]),

        new Word('lace', journalId, [4], GroupDisplayMode.Archived),

        new Word('knife', journalId, [4, 3], GroupDisplayMode.Archived),
        new Word('grab', journalId, [4, 6], GroupDisplayMode.Archived),
        new Word('tan', journalId, [4, 6], GroupDisplayMode.Archived),
        new Word('eight', journalId, [4, 5, 6], GroupDisplayMode.Archived),

        new Word('bedroom', journalId, [5]),
        new Word('therapeutic', journalId, [5, 2]),
        new Word('numerous', journalId, [5, 3]),
        new Word('mushy', journalId, [5, 4], GroupDisplayMode.Archived),
        new Word('owe', journalId, [5]),

        new Word('freezing', journalId, [6]),
        new Word('second', journalId, [6]),
        new Word('unbiased', journalId, [6]),
        new Word('party', journalId, [6])
    ]);
    // });
}
