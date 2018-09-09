import {
    Vue,
    Component,
    Inject,
    Model,
    Prop,
    Watch
} from 'vue-property-decorator';
import { Word } from './../store/modules/words';

export class Source extends Vue {
    @Prop() word: Word;

    definition: Definition | null = null;

    playSound(event: MouseEvent): void {
        console.log(event);
        (<HTMLAudioElement>(<HTMLElement>event.currentTarget)
            .firstElementChild).play();
    }
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
    constructor(
        public name: string = '',
        public senses: DefinitionSense[] = []
    ) {}
}

export class DefinitionPronunciation {
    constructor(
        public part: string = '',
        public spellings: string[] = [],
        public audios: string[] = []
    ) {}
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
