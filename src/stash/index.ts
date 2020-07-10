import Vue from 'vue';
import { Stash } from './internal';
import mixin from './mixin';

export * from './internal';

Vue.use(mixin);

// extend `ComponentOptions` to accept `stash` as one of the component options
declare module 'vue/types/options' {
    interface ComponentOptions<V extends Vue> {
        /**
         * A reference to a Stash instance.
         *
         * @type {Stash}
         * @memberof ComponentOptions
         */
        stash?: Stash;
    }
}

// extend `Vue` to expose `$stash` as the existing property
declare module 'vue/types/vue' {
    interface Vue {
        /**
         * A reference to a Stash instance.
         *
         * @type {Stash}
         * @memberof Vue
         */
        $stash: Stash;
    }
}
