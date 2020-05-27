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
