import Storage from '.././interface';

export default {
    hasCollection() {
        return Promise.resolve(false);
    }
} as Storage;

// https://jestjs.io/docs/en/mock-functions
// https://jestjs.io/docs/en/manual-mocks.html#content
