import { ActionContext } from 'vuex';
import to from 'await-to-js';
import { Subject, timer, from, zip } from 'rxjs';
import { takeUntil, concatAll } from 'rxjs/operators';

import { DisplayState } from './display-state';
import { RootState } from '@/store/state';
import { CollectionWord } from '../collection';
import { Definition, Wordbook } from '@/api/wordbook';

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

const requestStream = new Subject();

const getters = {};

const actions = {
    [Action.setWordbooks](context: DisplayContext, { value }: { value: Wordbook[] }): void {
        context.commit(Mutation.SET_WORD_BOOKS, { value });
    },

    async [Action.loadDefinitions](context: DisplayContext, { value }: { value: CollectionWord }): Promise<void> {
        const state = context.state;

        // submit an new event into the request stream to stop any subscribers from previous requests
        requestStream.next();

        // reset the list of definitions
        context.commit(Mutation.SET_DEFINITIONS, { value: [] });

        // set the current word
        context.commit(Mutation.SET_WORD, { value });

        // TODO: skip wordbook if it takes longer than a certain time to load
        // start loading definitions on the all the wordbooks
        // to() will catche errors and return them as part of an [error, definition] tuple
        const promiseArray = state.wordbooks.map(wb => to(wb.load(value)));

        const wordbookStream = from(state.wordbooks);
        const metronomeStream = timer(300, 70).pipe(takeUntil(requestStream));
        const definitionStream = from(promiseArray).pipe(concatAll());

        // add resolved definitions in the order of the wordbooks even if the definitions load in different order.
        // delay initial definition loading by 350sm and stagger further definition loading by 100ms for smoother feel (esp when they load extremely fast)
        zip(metronomeStream, wordbookStream, definitionStream).subscribe(([_, wordbook, [error, definition]]) => {
            if (!definition) {
                console.log('Definition not found in', wordbook.id);
            } else {
                console.log('Definition found in', wordbook.id);

                // stagger definition loading by 100ms for smoother feel (esp when they load extremely fast)
                context.commit(Mutation.SET_DEFINITIONS, { value: [...state.definitions, [wordbook, definition]] });
            }
        });
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
