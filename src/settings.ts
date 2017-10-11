import settings from 'electron-settings';

const gistTokenKey: string = 'gist.token';
const gistIdKey: string = 'gist.id';
const gistFileNameKey: string = 'gist.fileName';

export {
    settings as storage,

    gistTokenKey,
    gistIdKey,
    gistFileNameKey
};
