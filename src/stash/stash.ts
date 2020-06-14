import { Vue } from 'vue-property-decorator';
import { JournalsModule } from './internal';

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

    constructor() {
        this.$vm = new Vue<{ journals: JournalsModule }>({
            data: {
                journals: new JournalsModule(this)
            }
        });
    }
}
