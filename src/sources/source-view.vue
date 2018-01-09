<template>

    <section>
        blah
        1
        <slot name="one"></slot>
        2

        _
        <slot></slot>
    </section>

</template>


<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import { Definition } from './source.class';

@Component
export default class SourceView extends Vue {
    @Prop() definition: Definition;
}
</script>

<style lang="sass" scoped>

</style>
