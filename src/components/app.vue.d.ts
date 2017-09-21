import Vue from 'vue';
import { Word } from '../types';
export default class App extends Vue {
    msg: string;
    count: number;
    newWord: string;
    cache: any;
    mounted(): void;
    readonly words: Word[];
    onChildChanged(newVal: Word[], oldVal: Word[]): void;
    addNew(): void;
    updateStorage(): void;
}
