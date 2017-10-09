import uniqid from 'uniqid';
import moment from 'moment';

export interface WordOptions {
    text?: string,
    id?: string,
    archived?: boolean,
    noteId?: string,

    dateAdded?: number
};

export class Word {
    text: string;
    readonly id: string;
    archived: boolean;
    noteId: string;

    readonly dateAdded: number;

    constructor({ id = uniqid.time(), text = '', archived = false, noteId = '', dateAdded = moment.now() }: WordOptions = {}) {
        if (!text) {
            // TODO: complain or throw error
            return;
        }

        this.id = id;
        this.text = text;
        this.archived = archived;
        this.noteId = noteId;

        this.dateAdded = dateAdded;
    }

    get JSON() {
        return {
            id: this.id,
            text: this.text,
            archived: this.archived,
            noteId: this.noteId
        };
    }
}

export interface WordsState {
    items: Word[]
};
