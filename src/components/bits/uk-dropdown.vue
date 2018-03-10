<template>
    <div :uk-dropdown="options">
        <slot></slot>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop, Emit } from 'vue-property-decorator';

import UIkit from 'uikit';

interface UkDropdown extends HTMLElement {
    hide: () => void;
}

@Component
export default class UkDropdownV extends Vue {
    @Emit('show')
    emShow() {}

    @Emit('hide')
    emHide() {}

    @Prop({ default: 'click' })
    mode: string;
    @Prop({ default: 'bottom-left' })
    pos: string;
    @Prop({ default: 800 })
    delayHide: string;

    get ukDropdown(): UkDropdown {
        return UIkit.dropdown(this.$el);
    }

    get options(): string {
        return `mode: ${this.mode}; pos: ${this.pos}; delay-hide: ${this.delayHide}`;
    }

    mounted(): void {
        UIkit.util.on(this.$el, 'show', this.positionDropdown);
        UIkit.util.on(this.$el, 'hide', this.emHide);

        /* UIkit.util.on(this.$el, 'shown', function() {
            console.log('shown');
        }); */

        // (<any>this.ukDropdown).on('blah');
    }

    positionDropdown(): void {
        document.addEventListener('wheel', this.hide);

        this.emShow();

        const bbox = this.$el.getBoundingClientRect();
        this.$el.style.position = 'fixed';
        this.$el.style.left = `${bbox.left - 10}px`;
        this.$el.style.top = `${bbox.top}px`;
    }

    hide(): void {
        this.ukDropdown.hide();

        document.removeEventListener('wheel', this.hide);
    }
}
</script>


<style lang="scss" scoped>

</style>


