import { Vue } from 'vue-property-decorator';
import { GroupsModule, JournalsModule, ResourcesModule, SentencesModule, WordsModule } from './internal';

export class Stash {
    $vm: Vue;

    /**
     * Journals stash module.
     *
     * @readonly
     * @type {JournalsModule}
     * @memberof Stash
     */
    get journals(): JournalsModule {
        return this.$vm.$data.journals;
    }

    get groups(): GroupsModule {
        return this.$vm.$data.groups;
    }

    get words(): WordsModule {
        return this.$vm.$data.words;
    }

    get resources(): ResourcesModule {
        return this.$vm.$data.resources;
    }

    get sentences(): SentencesModule {
        return this.$vm.$data.sentences;
    }

    constructor() {
        interface VMData {
            journals: JournalsModule;
            groups: GroupsModule;
            words: WordsModule;
            resources: ResourcesModule;
            sentences: SentencesModule;
        }

        this.$vm = new Vue<VMData>({
            data: {
                journals: new JournalsModule(this),
                groups: new GroupsModule(this),
                words: new WordsModule(this),
                resources: new ResourcesModule(this),
                sentences: new SentencesModule(this)
            }
        });
    }
}
