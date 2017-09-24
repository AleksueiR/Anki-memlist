import { AxiosPromise, AxiosInstance } from 'axios';

// https://github.com/mzabriskie/axios/issues/718
export function promise<T>(axiosPromise: AxiosPromise): Promise<T> {
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