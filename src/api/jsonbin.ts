import axios, { AxiosPromise, AxiosInstance } from 'axios';
import { promise } from './utils';
import { JSONBIN_BIN_ID } from './../config';

const BASE_URL = '//jsonbin.io/b';

const server: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000
});

server.defaults.headers.post['Content-Type'] = 'application/json';

export default {
    async get<T>(version = 'latest'): Promise<T> {

        return await promise<T>(server.get(`${BASE_URL}/${JSONBIN_BIN_ID}/${version}`));
    },

    async post<T>(data: T): Promise<void> {
        const payload = {
            snippet: JSON.stringify(data)
        };

        return await promise<void>(server.post(`${BASE_URL}/update/${JSONBIN_BIN_ID}`, payload));
    }
};