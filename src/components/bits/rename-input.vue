<template>

    <div class="rename-container">
        <input
            class="uk-input rename-input"
            type="text"

            :value="value"

            @keydown.stop.enter="complete($event.target.value)"
            @keydown.stop.escape="complete()"

            v-input-focus
            @focus.once="onFocus"
            @blur="complete()"

            @mousedown.stop="vnull"
            @click.stop="vnull" />
    </div>

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
    //@input="input($event.target.value)"

    @Emit()
    complete(value: string) {}

    @Prop()
    value: string;

    /**
     * Preselect the current list name on focus.
     */
    onFocus(event: FocusEvent): void {
        (event.target as HTMLInputElement).select();
    }

    vnull(): void {}
}
</script>

<style lang="scss" scoped>
.rename-container {
    display: flex;
    position: relative;
    height: 2rem;
}

.rename-input {
    border-radius: 0;
    font-size: 0.8rem;
    height: 1.5rem;
    margin-left: calc(0.5rem + 30px - 10px);
}
</style>


