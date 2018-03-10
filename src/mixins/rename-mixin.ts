import { Vue, Component, Emit } from 'vue-property-decorator';

/**
 * to use:
 * 'extends mixins(UpdateRouteMixin)'
 * Then everything on this class will be available
 */
@Component
export default class RenameMixin extends Vue {
    @Emit()
    renameStart(payload: { id: string }) {}

    @Emit()
    renameComplete(payload: { id: string; name?: string }) {}

    @Emit()
    renameCancel(payload: { id: string }) {}

    renameKey: number = Vue.config.keyCodes.f2 as number;

    isRenaming: boolean = false;
    newName: string = '';

    // provided by the parent component
    id: string;
    // provided by the parent component
    getCurrentName(): string {
        return '';
    }

    mounted(): void {
        this.$el.addEventListener('keydown', this.keyDownHandler);
    }

    keyDownHandler(event: KeyboardEvent): void {
        switch (event.keyCode) {
            case this.renameKey:
                this.startRename();
                break;

            case Vue.config.keyCodes.enter:
                if (!this.isRenaming) {
                    return;
                }
                this.completeRename();

                break;

            case Vue.config.keyCodes.esc:
                if (!this.isRenaming) {
                    return;
                }
                this.cancelRename();

                break;
        }
    }

    startRename(): void {
        if (this.getCurrentName) {
            this.newName = this.getCurrentName();
        }

        this.renameStart({ id: this.id });
        this.isRenaming = true;
    }

    completeRename(): void {
        this.renameComplete({ id: this.id, name: this.newName });
        this.isRenaming = false;
        this.$el.focus();
    }

    cancelRename(): void {
        this.renameCancel({ id: this.id });
        this.isRenaming = false;
        this.$el.focus();
    }

    destroyed(): void {
        this.$el.removeEventListener('keydown', this.startRename);
    }
}
