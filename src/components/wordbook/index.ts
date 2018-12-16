import Vue from 'vue';
import VerbalAdvantageV from './verbaladvantage.vue';
import VocabularyV from './vocabulary.vue';
import OxfordDictionariesV from './oxforddictionaries.vue';

console.log('register');

Vue.component('verbaladvantage-wordbook', VerbalAdvantageV);
Vue.component('vocabulary-wordbook', VocabularyV);
Vue.component('oxforddictionaries-wordbook', OxfordDictionariesV);
