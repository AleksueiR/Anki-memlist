import wordList from './components/list/word-list.vue';
import wordEditor from './components/word-editor.vue';

const routes = [
    { path: '/long-list', component: wordList, name: 'list' },
    { path: '/word-editor/:id', component: wordEditor, name: 'editor', props: true }
];

export default routes;
