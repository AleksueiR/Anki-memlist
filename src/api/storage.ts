//jsonbin.io/b/59bd7cd3b734484e1c303884/latest

import axios from 'axios';

import { WordInterface } from '../types';

const BASE_URL = '//jsonbin.io/b';
const BIN_ID = '59bd7cd3b734484e1c303884';

export default {
    getWords():Promise<WordInterface[]> {
        const promise:Promise<WordInterface[]> = axios.get(`${BASE_URL}/${BIN_ID}/latest`)
            .then(response => response.data.words);

        return promise;
    },

    updateWords(words:WordInterface[]) {
        const payload = {
            snippet: JSON.stringify({ words: words })
        };
        const promise:Promise<void> = axios.post(`${BASE_URL}/update/${BIN_ID}`, payload)
            .then(response => console.log(response));

        return promise;
    }
}