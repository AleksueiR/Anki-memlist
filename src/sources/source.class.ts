import { Vue, Prop, Emit, Watch } from 'vue-property-decorator';
import { CollectionWord } from '@/store/modules/collection';

// TODO: turn this into a mixin
export class Source extends Vue {
    // TODO: deprecate
    @Emit()
    hasContent(value: boolean) {}

    @Prop()
    word: CollectionWord;

    definition: Definition | null = null;

    /**
     * Watch `definition` change and fire `hasContent` event depending on the value of the `definition`.
     * TODO: add a `loading` state; this can be fired every time when the `word` is changing
     * TODO: deprecate
     *
     * @param {(Definition | null)} value
     * @memberof Source
     */
    @Watch('definition')
    onDefinitionChange(value: Definition | null): void {
        this.hasContent(value !== null);
    }

    /* playSound(event: MouseEvent): void {
        console.log(event);
        (<HTMLAudioElement>(<HTMLElement>event.currentTarget).firstElementChild).play();
    } */
}

export class Definition {
    constructor(public groups: DefinitionGroup[] = []) {}
}

export class DefinitionGroup {
    constructor(
        public parts: DefinitionPart[] = [],
        public pronunciations: DefinitionPronunciation[] = [],
        public notes: DefinitionNote[] = [],
        public phrases: DefinitionPhrase[] = []
    ) {}
}

export class DefinitionPart {
    constructor(public name: string = '', public senses: DefinitionSense[] = []) {}
}

export class DefinitionPronunciation {
    constructor(public part: string = '', public spellings: string[] = [], public audios: string[] = []) {}
}

export class DefinitionNote {
    constructor(public title: string = '', public lines: string[] = []) {}
}

export class DefinitionPhrase {
    constructor(
        public text: string = '',
        public senseRegisters: string = '',
        public definition: string = '',
        public examples: string[] = []
    ) {}
}

export class DefinitionSense {
    constructor(
        public grammaticalNote: string = '',
        public senseREgisters: string = '',
        public definition: string = '',
        public examples: string[] = [],
        public subsenses: DefinitionSense[] = []
    ) {}
}
