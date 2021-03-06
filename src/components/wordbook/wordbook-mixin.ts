import { Component, Vue, Prop } from 'vue-property-decorator';
import { CollectionWord } from '@/store/modules/collection';
import { Wordbook, Definition } from '@/api/wordbook';

@Component
export default class WordbookMixin extends Vue {
    @Prop()
    word: CollectionWord;

    @Prop()
    definition: Definition;

    @Prop()
    wordbook: Wordbook;
}
