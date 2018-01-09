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

    definition: Definition = { groups: [] };

    playSound(event: MouseEvent): void {
        console.log(event);
        (<HTMLAudioElement>(<HTMLElement>event.currentTarget)
            .firstElementChild).play();
    }
}

export interface Definition {
    groups: DefinitionGroup[];
}

export interface DefinitionGroup {
    parts: DefinitionPart[];
    pronunciations: DefinitionPronunciation[];
    notes: DefinitionNote[];
    phrases: DefinitionPhrase[];
}

export interface DefinitionPart {
    name: string;
    senses: DefinitionSense[];
}

export interface DefinitionPronunciation {
    part: string;
    spellings: string[];
    audio: string;
}

export interface DefinitionNote {
    title: string;
    lines: string[];
}

export interface DefinitionPhrase {
    text: string;
    senseRegisters: string;
    definition: string;
    examples: string[];
}

export interface DefinitionSense {
    grammaticalNote: string;
    senseREgisters: string;
    definition: string;
    examples: string[];
    subsenses: DefinitionSense[];
}
