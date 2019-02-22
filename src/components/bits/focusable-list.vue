<template>
    <div
        tabindex="0"
        @focus="listOnFocus"
        @blur="listOnBlur"
        @keydown.prevent.down="listNext()"
        @keydown.prevent.page-down="listNext(10)"
        @keydown.prevent.up="listPrevious()"
        @keydown.prevent.page-up="listPrevious(10)"
    >
        <slot></slot>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop, Emit, Watch, Model } from 'vue-property-decorator';

@Component
export default class FocusableListV extends Vue {
    /**
     * The currently focused entry.
     *
     * @type {any}
     */
    @Model('change', { type: Object })
    entry: any;

    @Emit()
    change(value: any) {}

    @Watch('entry')
    onEntryChange(newValue: any | null, oldValue: any | null): void {
        this.previousEntry = oldValue;
        this.entryIndex = newValue ? this.allEntries.indexOf(newValue) : -1;

        // set focus to the list if the entry is not null
        // this is needed when the user mouse-clicks on a list item to transfer focus to the list
        // console.log('sdflsdj');

        if (newValue !== null) {
            (this.$el as HTMLElement).focus();
        }
    }

    /**
     * A list of all focusable entries.
     *
     * @type {any}
     */
    @Prop()
    allEntries: any[];

    @Watch('allEntries')
    onAllEntriesCHange(): void {
        this.onEntryChange(this.entry, this.previousEntry);
    }

    previousEntry: any = null;
    entryIndex: number = -1;

    listOnFocus(): void {
        if (this.entry) {
            return;
        }

        if (this.previousEntry && this.allEntries.includes(this.previousEntry)) {
            this.change(this.previousEntry);
            return;
        }

        if (this.allEntries.length > 0) {
            this.change(this.allEntries[0]);
        }
    }

    listOnBlur(): void {
        this.change(null);
    }

    listNext(step: number = 1): void {
        const targetIndex = Math.min(this.entryIndex! + step, this.allEntries.length - 1);
        this.change(this.allEntries[targetIndex]);
    }

    listPrevious(step: number = 1): void {
        const targetIndex = Math.max(this.entryIndex! - step, 0);
        this.change(this.allEntries[targetIndex]);
    }
}
</script>

<style lang="scss" scoped></style>
