<template>

    <input
        class="uk-input rename-input"
        type="text"

        :value="value"
        @input="input($event.target.value)"

        v-input-focus
        @focus.once="onFocus"

        @mousedown.stop="vnull"
        @click.stop="vnull">

</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop, Emit } from 'vue-property-decorator';

@Component({
    directives: {
        // Register a local custom directive called `v-input-focus`
        'input-focus': {
            // When the bound element is inserted into the DOM...
            inserted: (element: HTMLElement) => {
                // Focus the element
                // check if the element itself is an input; if not, search down for the closes input field
                const input = element.matches('input') ? element : element.querySelector('input');

                if (!input) {
                    return;
                }

                input.focus();
            }
        }
    }
})
export default class RenameInputV extends Vue {
    @Emit()
    input(value: string) {}

    @Prop() value: string;

    /**
     * Preselect the current list name on focus.
     */
    onFocus(event: FocusEvent): void {
        (<HTMLInputElement>event.target).select();
    }

    vnull(): void {}
}
</script>

<style lang="scss" scoped>
.rename-input {
    border-radius: 0;
}
</style>


