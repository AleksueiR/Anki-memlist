import { VueConstructor } from 'vue';

export default {
    /**
     * This function runs automatically by Vue when the mixin is registered using `Vue.use(...)` and allows to inject components options at different points in an instance life cycle.
     * The mixin exposes `stash` component option as `$stash` on the root Vue component and also copies it to all its children components, so the reference is available to any component inside the app as `this.$stash`.
     *
     * @param {VueConstructor} Vue
     */
    install(Vue: VueConstructor /* , options: ComponentOptions<Vue> */) {
        Vue.mixin({
            beforeCreate() {
                const options = this.$options;

                if (options.stash) {
                    // if `stash` option was set directly, assign it directly to the Vue instance as `$stash`, so it will be accessible to components
                    this.$stash = options.stash;
                } else if (options.parent && options.parent.$stash) {
                    // if the component has a parent with `stash` assigned, copy it to the Vue instance as `$stash`, so it can be accessed by components
                    this.$stash = options.parent.$stash;
                }
            }
        });
    }
};
