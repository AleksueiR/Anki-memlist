<template>
    <div class="foo">
        <span>hello!</span> 👩‍💼

        <button class="p-4 font-bold text-red-500 bg-gray-300 rounded-md">{{ text }}</button>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

@Component
export default class App extends Vue {
    text = "I'm button!21";

    mounted() {
        const a = 46;
        console.log('fsdf', a);
    }
}
</script>

<style lang="postcss">
@tailwind base;

@tailwind components;

@tailwind utilities;
</style>

<style lang="postcss" scoped></style>
