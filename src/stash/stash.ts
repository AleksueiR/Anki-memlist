import { Vue } from 'vue-property-decorator';
import { JournalsModule, GroupsModule } from './internal';

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

    constructor() {
        interface VMData {
            journals: JournalsModule;
            groups: GroupsModule;
        }

        this.$vm = new Vue<VMData>({
            data: {
                journals: new JournalsModule(this),
                groups: new GroupsModule(this)
            }
        });
    }
}
