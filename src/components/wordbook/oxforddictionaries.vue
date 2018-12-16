<template>
    <source-view :word="word" :definition="definition" :wordbook="wordbook"></source-view>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';

import WordbookMixin from './wordbook-mixin';

@Component
export default class OxfordDictionariesV extends mixins(WordbookMixin) {}
</script>

<style lang="scss" scoped></style>
