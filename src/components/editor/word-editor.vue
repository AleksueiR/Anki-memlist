<template>
    <div class="container">

        <!-- <quill-editor v-for="(modelField, index) in modelFields"
            :key="modelField"
            :initialHTML="noteFields[index]"
            :fieldName="modelField"></quill-editor> -->

        <header>
            <h1 class="title" v-if="word">{{ word.text }}</h1>

            <div class="controls">
                <word-menu></word-menu>
            </div>
        </header>

        <div class="null-state" v-if="!word" v-drag-target="{ onOver: onOver, onOut: onOut }">
            <img src="https://image.flaticon.com/icons/svg/326/326804.svg" />
            <span class="message"><span class="code">undefined</span> is not a word</span>
        </div>

        <section class="container main" v-if="word">

            <section class="content cm-scrollbar">
                    <div v-for="source in sourceOrder" :key="source.id" :id="source.id" class="source-view">
                        <h2 class="title"><span class="name">{{ source.name }}</span><span class="divider"></span></h2>
                        <component :is="source.id" :word="word" ></component>
                    </div>
            </section>

            <aside class="sidebar cm-scrollbar">
                <ul class="headings">
                    <li v-for="source in sourceOrder" :key="source.id" class="heading">
                        <a :href="`#${source.id}`" class="anchor">{{ source.name }}</a>
                    </li>
                </ul>

            </aside>
        </section>

    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';
import { mixins } from 'vue-class-component';

import anki from './../../api/anki';

import sources from './../../sources';

import CollectionStateMixin from '@/mixins/collection-state-mixin';

import { Word, dFetchWods, dSyncWords, rSelectedItem, rItems } from './../../store/modules/words';
import wordMenu from './../list/word-menu.vue';
import { CollectionWord } from '../../store/modules/collection/index';
import { DragObject } from '@/am-drag.plugin';

const StateCL = namespace('collection', State);
const GetterCL = namespace('collection', Getter);
const ActionCL = namespace('collection', Action);

@Component({
    components: Object.assign(
        {},
        {
            wordMenu: wordMenu
            // 'quill-editor': QuillEditor
        },
        sources
    )
})
export default class WordList extends mixins(CollectionStateMixin) {
    @Prop() id: string;

    activeTab: string = 'first';

    raw: string = '';

    sourceOrder = [
        {
            name: 'Vocabulary.com',
            id: 'vocabulary-source'
        },
        {
            name: 'Oxford Dictonaries',
            id: 'oxforddictionaries-source'
        },
        {
            name: 'Verbal Advantage',
            id: 'verbaladvantage-source'
        }
    ];

    // _word: Word | null = null;
    get word(): CollectionWord | null {
        if (this.lookupValue !== '') {
            return new CollectionWord({ text: this.lookupValue });
        }

        if (this.selectedWords.length === 0) {
            return null;
        }

        // TODO: when a word is renamed, reload the editor
        return this.selectedWords[0];

        //return rSelectedItem(this.$store);
    }

    created(): void {
        /*  this.$on(WORD_SELECTED, (word: Word) => {
            console.log(word);
            this._word = word;

            this.$nextTick();
        }); */
    }

    async mounted(): Promise<void> {
        /* this.editor = new Quill('#editor');

        this.editor.on('text-change', () => {
            console.log('???');

            this.raw = this.editor.root.innerHTML;
        }); */

        if (!this.id) {
            return;
        }

        anki.retrieveMediaFile('earth_global_circulation1_-_en.svg.png').then((data: any) => {
            //console.log(data);
        });

        this.modelFields = await anki.getModelFieldNames('Word Vault');

        this.notes = await anki.findNotes('English::Word Vault', 'Word', this.word!.text);
        this.noteFields = await anki.getFields(this.notes[0]);

        /* anki.getNotes('English::Word Vault', 'Word', this.word!.text).then(data => {
            console.log(data);
            this.notes = data;

            return anki.getFields(this.notes[0])
        }).then(data => {
            console.log(data);
            return anki.getModelFieldNames('Word Vault')
        }).then(data => {
            console.log(data);
        }) */
    }

    notes: number[] = [];
    modelFields: string[] = [];
    noteFields: string[] = [];

    onOver(event: MouseEvent, dragObject: DragObject): boolean {
        console.log('over', event, dragObject);
        this.$el.classList.add('drag-over');

        return true;
    }

    onOut(event: MouseEvent, dragObject: DragObject): void {
        console.log('out', event, dragObject);
        this.$el.classList.remove('drag-over');
    }
}
</script>

<style lang="scss" scoped>
@import '~quill/dist/quill.core.css';
@import './../../styles/variables';

.drag-over {
    border: 1px solid blue;
}

header {
    display: flex;
    align-items: center;
    flex-shrink: 0;

    .title {
        letter-spacing: 0px;
        font-size: 3em;
        text-transform: none;
        color: $primary-colour;
        font-weight: 300;
        display: block;
        white-space: nowrap;
        line-height: 64px;
        margin: 0 0 16px 0;
        padding: 0 1.5rem;
    }

    .controls {
        flex: 1;
        display: flex;
        justify-content: flex-end;
        padding: 1em;
    }
}

.container {
    display: flex;
    flex-direction: column;
}

.null-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: center;

    img {
        width: 7em;
        margin-bottom: 16px;
    }

    span {
        font-size: 1.2em;
    }

    .code {
        padding: 0.2em 0.4em;
        margin: 0;
        font-size: 85%;
        background-color: $secondary-colour;
        border-radius: 3px;
    }
}

.main {
    flex-direction: row;

    .content {
        flex: 1;
        padding-right: 1rem;

        .source-view {
            .title {
                display: flex;
                font-weight: 400;
                font-size: 2em;
                margin: 0 0 0 1.5rem;
                align-items: center;

                .name {
                    flex-shrink: 0;
                }

                .divider {
                    flex: 1;
                    border-bottom: 1px solid $even-darker-secondary-colour;
                    height: 0.4em;
                    margin: 0 1.5rem 0 1em;
                }
            }

            margin: 0 0 2.5em 0;
        }
    }

    .sidebar {
        width: 13em;
        flex-shrink: 0;

        .headings {
            padding: 0;
            margin: 0;
            list-style: none;
        }

        .heading {
            line-height: 1.4;
            font-weight: 700;

            .anchor {
                font-size: 14px;
                padding: 6px 20px;
                color: $text-colour;
                display: block;
                text-decoration: none;

                &:active,
                &:hover {
                    color: $accent-colour;
                }
            }
        }
    }
}
</style>
