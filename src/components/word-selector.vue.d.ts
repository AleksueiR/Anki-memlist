import Vue from 'vue';
import { Word } from './../store/modules/words';
export default class WordSelector extends Vue {
    lookupValue: string;
    readonly lookupResults: Word[];
    readonly isLookup: boolean;
    readonly isNewWord: boolean;
    addNewWord(event: any): void;
}
