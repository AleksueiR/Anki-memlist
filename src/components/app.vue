<template>

<div id="app">
    Hello, reloaded; 1! -1-6-
    <span>{{ msg }} {{ count }}</span>
    <div>
        <span class="test">green -</span>
        <span class="test2">orange</span>
    </div>

    <button v-on:click="updateStorage()">update store</button>

    <input type="text"
        v-model="newWord">

    <button v-on:click="addNew()">add new</button>

    <ul>
        <li v-for="word in items" :key="word.text">
            {{ word.text }} - {{ word.archived }} - {{ cache[word.text] }}
        </li>
    </ul>
</div>

</template>

<script lang='ts'>

import Vue from 'vue';
import Component from 'vue-class-component';
import { Inject, Model, Prop, Watch } from 'vue-property-decorator';
import { mapActions, mapGetters } from 'vuex';

import storage from './../api/jsonbin';
import anki from './../api/anki';

import { Word, dFetchWods, dSyncWords, rItems } from './../store/modules/words';

import Store from '../store';


@Component({})
export default class App extends Vue {
    msg = 'Hello world!!';
    count = 0;
    // words:WordInterface[] = [];
    newWord:string = '';
    cache:any = {

    };

    mounted() {
        dFetchWods(this.$store);

        const handle = setInterval(() =>
            (this.count += 3),
            1000);

        console.log('helo');
    }

    // computed
    get items(): Word[] {
        return rItems(this.$store);
    }

    /*@Watch('words')
    onChildChanged(newVal: Word[], oldVal: Word[]) {

        newVal.forEach(async word => {
            this.cache[word.text] = await anki.getNotes('English::Word Vault', 'Word', word.text);
        });
    }*/

    addNew() {
        this.items.push(new Word(this.newWord));
        this.newWord = '';
    }

    updateStorage() {
        dSyncWords(this.$store);
        // storage.updateWords(this.items);
    }
}
</script>

<style lang="scss" scoped>
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
    span {
        color: red;
    }
    div .test {
        color: green;
    }
    .test2 {
        color: orange;
    }
}
</style>