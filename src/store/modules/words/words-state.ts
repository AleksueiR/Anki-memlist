import uniqid from 'uniqid';

export interface WordOptions {
    text?: string,
    id?: string,
    archived?: boolean,
    noteId?: string,
};

export class Word {
    text: string;
    readonly id: string;
    archived: boolean;
    noteId: string;

    constructor({ id = uniqid.time(), text = '', archived = false, noteId = '' }: WordOptions = {}) {
        if (!text) {
            // TODO: complain
            return;
        }

        this.id = id;
        this.text = text;
        this.archived = archived;
        this.noteId = noteId;
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
