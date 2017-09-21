//jsonbin.io/b/59bd7cd3b734484e1c303884/latest

import axios from 'axios';

import { Word } from '../types';

const BASE_URL = '//jsonbin.io/b';
const BIN_ID = '59bd7cd3b734484e1c303884';

const FAKE_DATA = {"words":[{"archived":false,"value":"sapid"},{"archived":false,"value":"test"},{"value":"test","archived":false},{"archived":false,"value":"wonderful"},{"value":"Rapt","archived":false},{"archived":false,"value":"Sheer"}]};

export default {
    async getWords():Promise<Word[]> {
        /*const promise:Promise<Word[]> = axios.get(`${BASE_URL}/${BIN_ID}/latest`)
            .then(response => response.data.words);

        return promise;*/

        return await Promise.resolve(FAKE_DATA.words.map(fw => new Word(fw.value, fw.archived)));
    },

    updateWords(words:Word[]) {
        const payload = {
            snippet: JSON.stringify({ words: words })
        };
        const promise:Promise<void> = axios.post(`${BASE_URL}/update/${BIN_ID}`, payload)
            .then(response => console.log(response));

        return promise;
    }
}