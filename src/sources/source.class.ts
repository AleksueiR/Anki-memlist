import {
    Vue,
    Component,
    Inject,
    Model,
    Prop,
    Watch
} from 'vue-property-decorator';
import { Word } from './../store/modules/words';

export interface WordDefinition {
    soundUri?: string;
}

export class WordSource extends Vue {
    @Prop() word: Word;

    definition: WordDefinition;

    playSound(event: MouseEvent): void {
        console.log(event);
        (<HTMLAudioElement>(<HTMLElement>event.currentTarget)
            .firstElementChild).play();
    }
}
