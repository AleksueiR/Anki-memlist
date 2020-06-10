import Dexie from 'dexie';

import fakeIndexedDB from 'fake-indexeddb';
import IDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange';

Dexie.dependencies.indexedDB = fakeIndexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

// this fake-indexeddb with Dexie when running tests

export default Dexie;
