import Quill from 'quill';
import uniqid from 'uniqid';
import anki, { AnkiConnectResponse } from './../../api/anki';

// TODO: handle image copy/paste from the system
/* const clipboard = require('electron');
console.log(clipboard);
 */

 /**
 * Custom module for quilljs to allow user to drag images from their file system into the editor
 * and paste images from clipboard (Works on Chrome, Firefox, Edge, not on Safari)
 * @see https://quilljs.com/blog/building-a-custom-module/
 */
export default class ImageDrop {
    quill: Quill;

    /**
     * Instantiate the module given a quill instance and any options
     * @param {Quill} quill
     * @param {Object} options
     */
    constructor(quill: Quill, options = {}) {
        // save the quill reference
        this.quill = quill;
        // bind handlers to this instance
        this.handleDrop = this.handleDrop.bind(this);
        this.handlePaste = this.handlePaste.bind(this);
        // listen for drop and paste events
        this.quill.root.addEventListener('drop', this.handleDrop, false);
        this.quill.root.addEventListener('paste', this.handlePaste, false);
    }

    /**
     * Handler for drop event to read dropped files from evt.dataTransfer
     * @param {Event} evt
     */
    handleDrop(evt: any) {
        console.log('handle drop', evt);


        /* evt.preventDefault();
        if (evt.dataTransfer && evt.dataTransfer.files && evt.dataTransfer.files.length) {
            if (document.caretRangeFromPoint) {
                const selection = document.getSelection();
                const range = document.caretRangeFromPoint(evt.clientX, evt.clientY);
                if (selection && range) {
                    selection.setBaseAndExtent(range.startContainer, range.startOffset, range.startContainer, range.startOffset);
                }
            }
            this.readFiles(evt.dataTransfer.files, this.insert.bind(this));
        } */
    }

    /**
     * Handler for paste event to read pasted files from evt.clipboardData
     * @param {Event} evt
     */
    handlePaste(evt: any) {
        console.log('handle paste', evt);

        //evt.preventDefault();
        if (evt.clipboardData && evt.clipboardData.items && evt.clipboardData.items.length) {
            const imageFiles: File[] = [].filter.call(evt.clipboardData.items, ((file: File) => this.isImageFile(file)));

            // ignore pastes that don't have any images in them
            if (imageFiles.length === 0) {
                return;
            }

            evt.preventDefault();
            imageFiles.forEach(imageFile =>
                this.readFile(imageFile)
                .then((dataUrl: string) => {
                    const fileName = `${uniqid.time()}.png`;
                    // remove base 64 prefix
                    const commanIndex = dataUrl.indexOf(',') + 1;
                    dataUrl = dataUrl.slice(commanIndex);

                    this.saveFile(dataUrl, fileName);
                    this.insertFile(dataUrl, fileName, this.quill);
                }));
        }
    }

    /**
     * Insert the image into the document at the current cursor position
     * @param {String} dataUrl  The base64-encoded image URI
     */
    insert(dataUrl: string) {
        // otherwise we wait until after the paste when this.quill.getSelection()
        // will return a valid index
        setTimeout(() => this.insert(dataUrl), 0);
        const index = (this.quill.getSelection() || {}).index || this.quill.getLength();
        this.quill.insertEmbed(index, 'image', dataUrl, 'user');
    }

    insertFile(dataUrl: string, fileName: string, quill: Quill): void {
        const index = (quill.getSelection() || {}).index || quill.getLength();
        quill.insertEmbed(index, 'image', { fileName, dataUrl }, 'user');
    }

    saveFile(dataUrl: string, fileName: string): void {
        // TODO: allow for saving gifs as well

        anki.storeMediaFile(fileName, dataUrl)
            .then((response: AnkiConnectResponse) => {
            // TODO: show an error notifcation is image store fails
            /* if (response.error !== null) {
                return Promise.reject(response.error);
            } */

            console.log('file Stored');
        });
    }

    readFile(file: File): Promise<string> {
        // set up file reader
        const readPromise = new Promise<string>((resolve, reject) => {

            const reader: FileReader = new FileReader();
            reader.onload = (evt) => {
                resolve((<FileReader>evt.target).result);
            };

            // read the clipboard item or file
            const blob = this.isDataTransferItem(file) ? file.getAsFile() : file;
            if (blob instanceof Blob) {
                reader.readAsDataURL(blob);
            } else {
                reject();
            }
        });

        return readPromise;
    }

    /**
     * Extract image URIs a list of files from evt.dataTransfer or evt.clipboardData
     * @param {File[]} files  One or more File objects
     * @param {Function} callback  A function to send each data URI to
     */
    /* readFiles(files: File[], callback: Function) {
        // check each file for an image
        [].forEach.call(files, (file: File) => {
            if (!file.type.match(/^image\/(gif|jpe?g|a?png|svg|webp|bmp|vnd\.microsoft\.icon)/i)) {
                // file is not an image
                // Note that some file formats such as psd start with image/* but are not readable
                return;
            }
            // set up file reader
            const reader = new FileReader();
            reader.onload = (evt) => {
                callback((<FileReader>evt.target).result);
            };

            // read the clipboard item or file
            const blob = this.isDataTransferItem(file) ? file.getAsFile() : file;
            if (blob instanceof Blob) {
                reader.readAsDataURL(blob);
            }
        });
    } */

    isImageFile(file: File): boolean {
        // file is not an image
        // Note that some file formats such as psd start with image/* but are not readable
        return file.type.match(/^image\/(gif|jpe?g|a?png|svg|webp|bmp|vnd\.microsoft\.icon)/i) !== null;
    }

    isDataTransferItem(x: any): x is DataTransferItem {
        return !!x.getAsFile;
    }
}
