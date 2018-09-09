import local from './local';
import Storage from './interface';

const storageOptions: Storage[] = [local];
const selectedStorageId: string = 'local';

// TODO: find out how to switch storage options on the fly
export default storageOptions.find(
    storageOption => storageOption.id === selectedStorageId
) as Storage;
