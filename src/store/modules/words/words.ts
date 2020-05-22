import { ActionContext, Store } from 'vuex';

import gists from './../../../api/gists';

import { Word, WordsState } from './words-state';
import { RootState } from './../../state';

import { gistIdSetting, gistFileNameSetting } from './../../../settings';

type WordsContext = ActionContext<WordsState, RootState>;

const state: WordsState = {
    selectedItem: null,
    items: []
};

// getters
// retuns Word collection from the WordsState store
const getters = {
    items: (state: WordsState): Word[] => state.items,
    selectedIted: (state: WordsState): Word | null => state.selectedItem
};

// actions
const actions = {
    async fetchWords(context: WordsContext): Promise<void> {
        console.log('fetchwords');

        try {
            const fetchedState: WordsState = await gists.get<WordsState>(gistIdSetting.get(), gistFileNameSetting.get());

            mutations.keepWords(context.state, {
                items: fetchedState.items
            });
        } catch (error) {
            console.log('error', error);
        }

        /* cKeepWords(context, {
            items: (await gists.get<WordsState>(
                gistIdSetting.get(),
                gistFileNameSetting.get()
            )).items
        }); */
    },

    async syncWords(context: WordsContext): Promise<void> {
        return await gists.post<WordsState>(state, gistIdSetting.get(), gistFileNameSetting.get());
    }
};

// mutations
const mutations = {
    selectWord(state: WordsState, item: Word | null) {
        state.selectedItem = item;

        // window.setTimeout(() => (state.selectedItem = item), 1000);
        // on mutations, can trigger actions to fetch some data
    },

    // stores Word collection in the WordsState store
    keepWords(state: WordsState, { items }: { items: Word[] }) {
        state.items = items.map(item => new Word(item));

        // state cannot be replaced directly
        /* state = {
            items: items.map(item => new Word(item)),
            selectedItem: null
        }; */
    },

    _addWord(state: WordsState, word: Word) {
        state.items.push(word);
    },

    _removeWord(state: WordsState, word: Word) {
        const index: number = state.items.findIndex((w: Word) => w === word);

        if (index !== -1) {
            state.items.splice(index, 1);
        }
    }
};

export const words = {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
