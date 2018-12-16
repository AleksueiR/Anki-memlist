import { Component, Vue, Prop } from 'vue-property-decorator';
import { CollectionWord } from '@/store/modules/collection';
import { Definition } from '@/sources/source.class';
import { Wordbook } from '@/api/wordbook';

@Component
export default class WordbookMixin extends Vue {
    @Prop()
    word: CollectionWord;

    @Prop()
    definition: Definition;

    @Prop()
    wordbook: Wordbook;
}
