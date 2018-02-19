import { Vue, Emit } from 'vue-property-decorator';

export default class CollectionBus extends Vue {
    @Emit()
    mountComplete(listId: string) {}

    @Emit()
    renameStart(listId: string) {}

    @Emit()
    renameComplete(listId: string, name: string | null) {}

    @Emit()
    renameCancel(listId: string) {}
}
