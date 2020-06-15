import { Vue } from 'vue-property-decorator';
import { JournalsModule, GroupsModule, WordsModule } from './internal';

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

    constructor() {
        interface VMData {
            journals: JournalsModule;
            groups: GroupsModule;
            words: WordsModule;
        }

        this.$vm = new Vue<VMData>({
            data: {
                journals: new JournalsModule(this),
                groups: new GroupsModule(this),
                words: new WordsModule(this)
            }
        });
    }
}
