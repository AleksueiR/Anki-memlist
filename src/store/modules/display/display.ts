import { ActionContext } from 'vuex';
import to from 'await-to-js';

import { DisplayState } from './display-state';
import { Definition } from '@/sources/source.class';
import { RootState } from '@/store/state';
import { CollectionWord } from '../collection';
import { Wordbook } from '@/api/wordbook';

type DisplayContext = ActionContext<DisplayState, RootState>;

const state: DisplayState = new DisplayState();

export enum Action {
    loadDefinitions = 'loadDefinitions',

    setWordbooks = 'setWordbooks'
}

export enum Mutation {
    SET_WORD = 'SET_WORD',
    SET_DEFINITIONS = 'SET_DEFINITIONS',
    SET_WORD_BOOKS = 'SET_WORD_BOOKS'
}

const getters = {};

const actions = {
    [Action.setWordbooks](context: DisplayContext, { value }: { value: Wordbook[] }): void {
        context.commit(Mutation.SET_WORD_BOOKS, { value });
    },

    async [Action.loadDefinitions](context: DisplayContext, { value }: { value: CollectionWord }): Promise<void> {
        const state = context.state;

        context.commit(Mutation.SET_DEFINITIONS, { value: [] });

        const tuples = state.wordbooks.map<[Wordbook, Promise<Definition>]>(wb => [wb, wb.load(value)]);
        let tuple;

        context.commit(Mutation.SET_WORD, { value });

        while (tuples.length > 0) {
            // error means the definition is not found
            tuple = tuples.shift()!;

            const [error, definition] = await to(tuple[1]);

            if (definition) {
                context.commit(Mutation.SET_DEFINITIONS, { value: [...state.definitions, [tuple[0], definition]] });
            }
        }
    }
};

const mutations = {
    [Mutation.SET_WORD](state: DisplayState, { value }: { value: CollectionWord }): void {
        state.word = value;
    },

    [Mutation.SET_DEFINITIONS](state: DisplayState, { value }: { value: [Wordbook, Definition][] }): void {
        state.definitions = value;
    },

    [Mutation.SET_WORD_BOOKS](state: DisplayState, { value }: { value: Wordbook[] }): void {
        state.wordbooks = value;
    }
};

export const display = {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
