import uniqid from 'uniqid';
import moment from 'moment';

export interface WordOptions {
    text?: string,
    id?: string,
    archived?: boolean,
    noteIds?: string[],

    dateAdded?: number
};

export class Word {
    text: string;
    readonly id: string;
    archived: boolean;
    noteIds: string[];

    readonly dateAdded: number;

    constructor({ id = uniqid.time(), text = '', archived = false, noteIds = [], dateAdded = moment.now() }: WordOptions = {}) {
        if (!text) {
            // TODO: complain or throw error
            return;
        }

        this.id = id;
        this.text = text;
        this.archived = archived;
        this.noteIds = noteIds;

        this.dateAdded = dateAdded;
    }

    get JSON() {
        return {
            id: this.id,
            text: this.text,
            archived: this.archived,
            noteIds: this.noteIds
        };
    }
}

export interface WordsState {
    items: Word[]
};
