import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8765';

export default {
    async getNotes(deckName:string, fieldName:string, word:string) {
        return '12345';

        /*const response = await axios.post(`${BASE_URL}`, {
            action: 'findNotes',
            version: 5,
            params: {
                query: `${fieldName}:'${word}*' deck:"${deckName}"`
            }
        });

        return response.data.result;*/
    }
};