import {
    Group,
    GroupDisplayMode,
    Journal,
    Word,
    WordInGroup,
    WordPouch,
    Resource,
    Sentence,
    SentenceInResource
} from '@/api/db';

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
    const journalId1 = await db.journals.put(new Journal('Second Journal'));

    const rootGroupId1 = await db.groups.put(new Group('Root group', journalId1));
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

    await db.groups.update(rootGroupId1, { subGroupIds: [2] });

    // create a second Journal
    const journalId2 = await db.journals.put(new Journal('Second Journal'));

    const rootGroupId2 = await db.groups.put(new Group('Root group Two', journalId2));
    await db.journals.update(journalId2, { rootGroupId: rootGroupId2 });

    const groupIds2 = await db.groups.bulkAdd(
        [
            new Group('Group Seven Two', journalId2), // 7
            new Group('Group Eight Two', journalId2) // 8
        ],
        { allKeys: true }
    );
    await db.groups.update(rootGroupId2, { subGroupIds: groupIds2 });

    await db.words.bulkAdd([
        new Word('steep', journalId1), // 1
        new Word('hilarious', journalId1), // 2
        new Word('work', journalId1, GroupDisplayMode.Archived), // 3
        new Word('ray', journalId1, GroupDisplayMode.Archived), // 4
        new Word('youthful', journalId1), // 5
        new Word('apparatus', journalId1, GroupDisplayMode.Archived), // 6

        new Word('treasure', journalId1, GroupDisplayMode.Archived), // 7
        new Word('office', journalId1), // 8
        new Word('gleaming', journalId1), // 9
        new Word('twist', journalId1), // 10
        new Word('trust', journalId1), // 11

        new Word('lace', journalId1, GroupDisplayMode.Archived), // 12

        new Word('knife', journalId1, GroupDisplayMode.Archived), // 13
        new Word('grab', journalId1, GroupDisplayMode.Archived), // 14
        new Word('tan', journalId1, GroupDisplayMode.Archived), // 15
        new Word('eight', journalId1, GroupDisplayMode.Archived), // 16

        new Word('bedroom', journalId1), // 17
        new Word('therapeutic', journalId1), // 18
        new Word('numerous', journalId1), // 19
        new Word('mushy', journalId1, GroupDisplayMode.Archived), // 20
        new Word('owe', journalId1), // 21

        new Word('freezing', journalId1), // 22
        new Word('second', journalId1), // 23
        new Word('unbiased', journalId1), // 24
        new Word('party', journalId1), // 25

        new Word('company', journalId2), // 26
        new Word('parent', journalId2) // 27,
    ]);

    const wordsInGroupsMap: [number, number][] = [
        [1, 2],
        [2, 2],
        [3, 2],
        [4, 2],
        [5, 2],
        [5, 3],
        [5, 5],
        [5, 6],
        [6, 2],
        [6, 3],
        [6, 4],
        [6, 5],
        [6, 6],
        [7, 3],
        [8, 3],
        [9, 3],
        [10, 3],
        [11, 3],
        [12, 4],
        [13, 4],
        [13, 3],
        [14, 4],
        [14, 6],
        [15, 4],
        [15, 6],
        [16, 4],
        [16, 5],
        [16, 6],
        [17, 5],
        [18, 5],
        [18, 2],
        [19, 5],
        [19, 3],
        [20, 5],
        [20, 4],
        [21, 5],
        [22, 6],
        [23, 6],
        [24, 6],
        [25, 6],
        [26, 7],
        [26, 8],
        [27, 8]
    ];

    await db.wordsInGroups.bulkAdd(wordsInGroupsMap.map(args => new WordInGroup(...args)));

    const resourceId1 = await db.resources.bulkAdd([new Resource('eclectic', journalId1, 1)]);

    const eclecticSentenceIds = await db.sentences.bulkAdd(
        [
            'In the matter of Universals.',
            'He is not a systematic thinker, but is too much affected by the eclectic notion of reconciling all philosophies.',
            'In philosophy there has been a remarkable increase of activity.',
            'In the last stage of Greek philosophy the eclectic spirit produced remarkable results outside the philosophies of those properly called eclectics.',
            'And yet Neoplatonism cannot be described as an eclectic system.'
        ].map(text => new Sentence(text, journalId1)),
        { allKeys: true }
    );

    await db.sentencesInResources.bulkAdd(
        eclecticSentenceIds.map(sentenceId => new SentenceInResource(sentenceId, resourceId1))
    );

    // });
}
