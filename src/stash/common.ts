import { Stash } from './internal';

export class StashModule {
    protected readonly $stash: Stash;

    constructor(stash: Stash) {
        // mark $stash as not enumerable so Vue doesn't make it reactive
        Object.defineProperty(this, '$stash', {
            value: stash,
            enumerable: false,
            writable: false
        });
    }
}
