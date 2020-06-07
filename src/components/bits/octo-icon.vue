<template>
    <svg version="1.1" :width="side" :height="side" :viewBox="box" v-html="icon.path"></svg>

    <!-- :class="clazz"
        :role="label ? 'img' : 'presentation'"
        :aria-label="label"
        :x="x"
        :y="y"
        :style="style" -->
</template>

<script lang="ts">
import octicons from '@primer/octicons';

import Vue from 'vue';
import { Component, Prop, Emit } from 'vue-property-decorator';

const icons = {
    ...octicons,
    ...{
        'bookmark-plain': {
            name: 'bookmark-plain',
            // "figma": { "id": "0:54", "file": "FP7lqd1V00LUaT5zvdklkkZr" },
            keywords: ['tab'],
            width: 10,
            height: 16,
            path: '<path fill-rule="evenodd" d="M9,0H1C.27,0,0,.27,0,1V16l5-3.09L10,16V1C10,.27,9.73,0,9,0Z"/>',

            // TODO: following properites are dynamically created for native octoicons
            key: 'bookmark-plain',
            options: {
                version: '1.1',
                width: 10,
                height: 16,
                viewBox: '0 0 10 16',
                class: 'octicon octicon-bookmark-plain',
                'aria-hidden': 'true'
            }
        }
    }
};

@Component
export default class OctoIconV extends Vue {
    @Prop()
    name: string;
    @Prop({ default: 1 })
    scale: number;

    get side(): number {
        return Math.max(this.icon.options.width, this.icon.options.height) * this.scale;
    }

    get box() {
        return this.icon.options.viewBox;
    }

    get icon() {
        return icons[this.name];
    }
}
</script>

<style lang="scss" scoped></style>
