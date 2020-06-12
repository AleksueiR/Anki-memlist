import Vue from 'vue';
import { Stash } from './internal';
import mixin from './mixin';

export * from './internal';

Vue.use(mixin);

// extend `ComponentOptions` to accept `iApi` as one of the component options
declare module 'vue/types/options' {
    interface ComponentOptions<V extends Vue> {
        /**
         * A reference to R4MP API instance controlling this R4MP Vue app.
         *
         * @type {InstanceAPI}
         * @memberof ComponentOptions
         */
        stash?: Stash;
    }
}

// extend `Vue` to expose `$iApi` as the existing property
declare module 'vue/types/vue' {
    interface Vue {
        /**
         * A reference to R4MP API instance controlling this R4MP Vue app.
         *
         * @type {InstanceAPI}
         * @memberof Vue
         */
        $stash: Stash;
        stash: Stash;

        $vm: Vue;
    }
}
