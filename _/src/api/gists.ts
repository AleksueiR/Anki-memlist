import Gists from 'gists';

import { gistTokenSetting } from './../settings';

// import { CollectionState, WordList } from './../store/modules/collection';

function gists(): any {
    return new Gists({
        token: gistTokenSetting.get()
    });
}

export default {
    get<T>(gistId: string, fileName: string): Promise<T> {
        const gistPromise = new Promise<T>((resolve, reject) => {
            gists().download({ id: gistId }, (err: any, data: any) => {
                // 'Not Found'

                console.log('---', data);
                if (err !== null) {
                    reject(err);
                }

                if (data.message === 'Not Found') {
                    reject(new Error('404'));

                    return;
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
            gists().edit(options, (err: any, data: any) => {
                if (err !== null) {
                    reject(err);
                }

                resolve();
            });
        });

        return gistPromise;
    }

    /* post2(
        data: CollectionState,
        gistId: string,
        fileName: string
    ): Promise<void> {
        interface Options {
            description: string;
            public: boolean;
            files: { [name: string]: { content: string } };
        }

        const options: Options = {
            description: 'what description?',
            public: false,
            files: {
                '.WordCollection.md': {
                    content: `# Word Collector

                    some info here about what this is`
                },
                'index.json': {
                    content: JSON.stringify(data.tree)
                }
            }
        };

        data.lists.forEach(
            (list: WordList) =>
                (options.files[`${list.id}.json`] = {
                    content: JSON.stringify(list)
                })
        );

        // TODO: create function needs to call `POST /gists` not `POST /gists/`
        const gistPromise = new Promise<void>((resolve, reject) => {
            gists().create(options, (err: any, data: any) => {
                if (err !== null) {
                    reject(err);
                }

                console.log('create', err, data);

                resolve();
            });
        });

        return gistPromise;
    } */
};
