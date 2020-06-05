Ref

-   [ ] turn collection items (CollectionWord, CollectionList, CollectionTree, CollectionIndex) into dumb json object, not class instances (this will simplify access and storage)
    -   [ ] move all the functions from the above classes to the store

---

-   get rid of PWA
-   get rid of electron
-   get rid of UI kit

-   use tailwind
-   use localforage (https://github.com/localForage/localForage) instead of electron storage
    -   figure our import/export of the collection (for backup and such)
-   use Azure function to load things (enable CORS)
-   use pathify to simply vuex access
-   add "sources" feature
-   use
    `[sound:https://audio.vocab.com/1.0/us/C/14ZQS7XH33M9X.mp3]` syntax for sounds as anki can use remote media (use this addon to localize media files: https://ankiweb.net/shared/info/1293255374)
-   use router to switch between lists and sources
-   cache 10ish last requests to a service, so that it's faster to switch between words

## Notes

-   individual components are welcome to call the store directly using pathify; no need to pump events up until the parent component needs to do something fancy
-   store items in the store as flat as you can (https://stackoverflow.com/questions/54345327/is-using-es6-classes-in-vue-vuex-flux-an-anti-pattern)
-   export/import can work on a single file with everything included.
-   with sources, if the word is found in other lists, we can look up the word in the sources of that list as well, not only in the current list
-   can use `subscribe` function of vuex to listen to mutations and potentially update `dateModified` value after stuff is changed

-   `refresh pooled words` function to be called when selecting (or adding to the selection) a list or the lookup query changes
-   this function should figure out what takes precedence (lookup!) and refresh the pooled words
-   pooled words array should be the collection of word object so to avoid a case when a word is updated elsewhere but is not synced
-   pooled words can be grouped or sorted (like lookup results are grouped by list)
-   all lists are loaded (there is no sense in not loading lists which are in collapsed groups)

    -   so, in this case, maybe it does make sense to store lists in a form of a tree? lol
    -   ok, no sense in that; do that same as with words; there should be a function that figures out what lists are visible and which ones should be loaded; hm, but that means there should be a tree; duh :/
    -   ~~load all the lists belonging to the current collection and then go from there~~
    -   there should be a `visible lists` collection which is being updated as the tree expands and collapses, oh lol, but how to display names of lists in the word groups? these names should be populated from the db directly? duh;
    -   just rebuild the `visible lists` by traversing the tree again(?) when:
        -   collapsing lists
        -   expanding
        -   adding lists
        -   removing lists
    -   is this really a problem? why can't I just load everything into memory? because it's a cool concept, lol

    -   how to handle counts? don't want to query the database every time there is a binding call

    -   lol, you can't edit list name while the lookup is going on; that's it; fork; yes, to edit list's name, the list needs to be selected, and as soon as you select a list, the lookup is cancelled; duh;
    -   I think that loading all the groups upfront is acceptable

-   when switching to a list, the first word is auto-selected

-   try using https://github.com/tangbc/vue-virtual-scroll-list again
