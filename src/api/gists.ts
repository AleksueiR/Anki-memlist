import Gists from 'gists';

import { storage, gistTokenKey } from './../settings';

const gists = new Gists({
    token: storage.get(gistTokenKey)
});

export default {
    get<T>(gistId: string, fileName: string): Promise<T> {
        const gistPromise = new Promise<T>((resolve, reject) => {
            gists.download({ id: gistId }, (err: any, data: any) => {
                if (err !== null) {
                    reject(err);
                }

                resolve(JSON.parse(data.files[fileName].content));
            });
        });

        return gistPromise;
    },

    post<T>(data: T, gistId: string, fileName: string): Promise<void> {
        const options = {
            id: gistId,
            files: {
                [fileName]: {
                    content: JSON.stringify(data)
                }
            }
        };

        const gistPromise = new Promise<void>((resolve, reject) => {
            gists.edit(options, (err: any, data: any) => {
                if (err !== null) {
                    reject(err);
                }

                resolve();
            });
        });

        return gistPromise;
    },
}

