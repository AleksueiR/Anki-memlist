// import anki, { AnkiConnectResponse } from './../../api/anki';

// import Quill from 'quill';
// const Block = Quill.import('blots/block');
// const Image = Quill.import('formats/image');

// import ImageDrop from './image-drop';

// Quill.register('modules/imageDrop', ImageDrop);

// // import Snow from 'quill/themes/snow';

// /* Quill.register({
//     'themes/snow': Snow
// }); */

// // override block to use 'div'
// Block.tagName = 'div';
// Quill.register(Block, true);

// // override image block to load data from anki
// // TODO: add override to save newly added images to anki
// class ImageBlot extends Image {
//     static create(value: string | { dataUrl: string, fileName: string}) {
//         let node: HTMLElement;
//         let fileName;

//         if (isString(value)) {
//             if (/^data:image\/.+;base64/.test(value)) {
//                 node = super.create(value);
//                 return node;
//             } else {
//                 node = super.create('');

//                 anki.retrieveMediaFile(value).then((response: AnkiConnectResponse): void => {
//                     if (!response.result) {
//                         return;
//                     }

//                     prepImage(value, response.result);

//                 });
//             }
//         } else {
//             node = super.create(value.dataUrl);
//             prepImage(value.fileName, value.dataUrl);
//         }

//         return node;

//         function prepImage(fileName: string, dataUrl: string | JSON) {
//             const ext = fileName.split('.').pop();

//             node.setAttribute('data-filename', fileName);
//             node.setAttribute('src', `data:image/${ext};base64,${dataUrl}`);
//         }
//     }
// }

// function isString(x: any): x is string {
//     return typeof x === 'string';
// }

// Quill.register(ImageBlot, true);

// export default Quill;
