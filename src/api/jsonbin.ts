import axios, { AxiosPromise, AxiosInstance } from 'axios';

import { Word } from '../types';

import { JSONBIN_BIN_ID } from './../config';

const BASE_URL = '//jsonbin.io/b';

const FAKE_DATA = { "items": [{ "archived": false, "value": "sapid" }, { "archived": false, "value": "test" }, { "value": "test", "archived": false }, { "archived": false, "value": "wonderful" }, { "value": "Rapt", "archived": false }, { "archived": false, "value": "Sheer" }] };

const server: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000
});

server.defaults.headers.post['Content-Type'] = 'application/json';

export default {
    async get<T>(version = 'latest'): Promise<T> {

        return await promise<T>(server.get(`${BASE_URL}/${JSONBIN_BIN_ID}/${version}`));

        //return await axios.get(`${BASE_URL}/${JSONBIN_BIN_ID}/${version}`);
        // return await Promise.resolve(FAKE_DATA.items.map(fw => new Word(fw.value, fw.archived)));
    },

    async post<T>(data: T): Promise<void> {
        const payload = {
            snippet: JSON.stringify(data)
        };

        return await promise<void>(server.post(`${BASE_URL}/update/${JSONBIN_BIN_ID}`, payload));
    },

    /*async saveWords(words: Word[]): Promise<any> {
        const payload = {
            snippet: JSON.stringify({ items: words })
        };
        return await axios.post(`${BASE_URL}/update/${JSONBIN_BIN_ID}`, payload);
    }*/
}

const promise = <T>(axiosPromise: AxiosPromise): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
        axiosPromise
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.error(error.response.data);
                    console.error(error.response.status);
                    console.error(error.response.headers);
                    reject({
                        status: error.response.status,
                        message: error.response.data
                    });
                } else if (error.request) {
                    // The request was made but no response was received
                    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                    // http.ClientRequest in node.js
                    console.log(error.request);
                    reject({
                        status: 444,
                        message: "The request was made but no response was received"
                    });
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log("Error", error.message);
                    reject({
                        status: 417,
                        message: "Something happened in setting up the request that triggered an Error"
                    });
                }
                // console.log(error.config);
            });
    });
};