import Vue from 'vue';
import { WordInterface } from '../types';
export default class App extends Vue {
    msg: string;
    count: number;
    newWord: string;
    cache: {};
    mounted(): void;
    readonly words: WordInterface[];
    ankiWord(word: string): string;
    addNew(): void;
    updateStorage(): void;
}
