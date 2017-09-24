import Vue from 'vue';
import { Word } from './../store/modules/words';
export default class App extends Vue {
    msg: string;
    count: number;
    newWord: string;
    newWords: string;
    cache: any;
    mounted(): void;
    readonly items: Word[];
    addNew(): void;
    updateStorage(): void;
}
