import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8765';

export default {
    async findNotes(deckName: string, fieldName: string, word: string): Promise<number[]> {

        const response = await axios.post(`${BASE_URL}`, {
            action: 'findNotes',
            version: 5,
            params: {
                query: `${fieldName}:'${word}*' deck:"${deckName}"`
            }
        });

        console.log(`${fieldName}:'${word}*' deck:"${deckName}"`);


        return response.data.result;
    },

    async getModelFieldNames(modelName: string): Promise<string[]> {
        const response = await axios.post(`${BASE_URL}`, {
            action: 'modelFieldNames',
            version: 5,
            params: { modelName }
        });

        return response.data.result;
    },

    async getFields(id: number): Promise<string[]> {
        const response = await axios.post(`${BASE_URL}`, {
            action: 'getNote',
            version: 5,
            params: { id }
        });

        return response.data.result;
    },

    async retrieveMediaFile(fileName: string): Promise<string> {
        const response = await axios.post(`${BASE_URL}`, {
            action: 'retrieveMediaFile',
            version: 5,
            params: { filename: fileName }
        });

        return response.data.result;
    }
};