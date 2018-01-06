import settings from 'electron-settings';

const gistTokenKey: string = 'gist.token';
const gistIdKey: string = 'gist.id';
const gistFileNameKey: string = 'gist.fileName';

export class Setting {
    constructor(
        private key: string,
        public defaultValue: string = '',
        public nullValue: string = ''
    ) {}

    get safeKey(): string {
        return this.key.replace('.', '_');
    }

    get(): string {
        return settings.get(this.key, this.defaultValue) as string;
    }

    set(value: string) {
        settings.set(this.key, value);
    }

    has() {
        return settings.has(this.key);
    }
}

export const gistTokenSetting = new Setting(gistTokenKey);
export const gistIdSetting = new Setting(gistIdKey);
export const gistFileNameSetting = new Setting(gistFileNameKey);

function areSettingsValid(): boolean {
    return [gistTokenSetting, gistIdSetting, gistFileNameSetting].every(
        setting => setting.has() && setting.get() !== setting.nullValue
    );
}
export { areSettingsValid };

//settings.storage.set(settings.gistTokenKey, value);
// settings.storage.get(settings.gistTokenKey, '') as string;
