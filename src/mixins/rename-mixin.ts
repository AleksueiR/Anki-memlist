import { Vue, Component, Emit } from 'vue-property-decorator';

/**
 * to use:
 * 'extends mixins(RenameMixin)'
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
                this.completeRename();

                break;

            case Vue.config.keyCodes.esc:
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
        if (!this.isRenaming) {
            return;
        }

        console.log('completRename');
        this.renameComplete({ id: this.id, name: this.newName });
        this.isRenaming = false;
        this.$el.focus();
    }

    cancelRename(keepFocus: boolean = true): void {
        if (!this.isRenaming) {
            return;
        }

        console.log('cancelRename', keepFocus);

        this.renameCancel({ id: this.id });
        this.isRenaming = false;

        if (!keepFocus) {
            return;
        }

        this.$el.focus();
    }

    destroyed(): void {
        this.$el.removeEventListener('keydown', this.startRename);
    }
}
