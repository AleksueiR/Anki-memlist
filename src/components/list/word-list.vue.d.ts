import Vue from 'vue';
import { Word } from './../../store/modules/words';
export default class WordList extends Vue {
    readonly items: Word[];
}
