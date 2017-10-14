import anki from './../../api/anki';

import Quill from 'quill';
const Block = Quill.import('blots/block');
const Image = Quill.import('formats/image');

// import Snow from 'quill/themes/snow';

/* Quill.register({
    'themes/snow': Snow
}); */

// override block to use 'div'
Block.tagName = 'div';
Quill.register(Block, true);

// override image block to load data from anki
// TODO: add override to save newly added images to anki
class ImageBlot extends Image {
    static create(value: string) {
        const node: HTMLElement = super.create(value);

        anki.retrieveMediaFile(value).then((imageData: string): void => {
            const ext = value.split('.').pop();

            node.setAttribute('data-filename', value);
            node.setAttribute('src', `data:image/${ext};base64,${imageData}`);
        });

        return node;
    }
}

Quill.register(ImageBlot, true);

export default Quill;