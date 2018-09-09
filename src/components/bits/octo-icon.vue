<template>

    <svg version="1.1"
        :width="side"
        :height="side"
        :viewBox="box"
        v-html="icon.path">
    </svg>

    <!-- :class="clazz"
        :role="label ? 'img' : 'presentation'"
        :aria-label="label"
        :x="x"
        :y="y"
        :style="style" -->

</template>

<script lang="ts">
import octicons from 'octicons';

import Vue from 'vue';
import { Component, Prop, Emit } from 'vue-property-decorator';

@Component
export default class OctoIconV extends Vue {
    @Prop() name: string;
    @Prop({ default: 1 })
    scale: number;

    get side(): number {
        return Math.max(this.icon.options.width, this.icon.options.height) * this.scale;
    }

    get box() {
        return this.icon.options.viewBox;
    }

    get icon() {
        return octicons[this.name];
    }
}
</script>

<style lang="scss" scoped>

</style>


