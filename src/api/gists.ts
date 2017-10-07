import Gists from 'gists';

const gists = new Gists({
    token: '6ec8daed64f083143438a50ef94892b1d81dc68f'
});

const gistId = 'ad3d67bd40fee687adf84405e5745e17';
const fileName = 'anki-words-memlist.json';

export default {
    get<T>(): Promise<T> {
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

    post<T>(data: T): Promise<void> {
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

