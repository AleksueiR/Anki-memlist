<template>
    <div class="container uk-flex-1">
        <header>
            <h1 class="title" v-if="word">{{ word.text }}</h1>
        </header>

        <div class="null-state" v-if="!word" v-drag-target="{ onOver: onOver, onOut: onOut, onDrop: onDrop }">
            <img src="https://image.flaticon.com/icons/svg/326/326804.svg" />
            <span class="message"><span class="code">undefined</span> is not a word</span>
        </div>

        <section class="container main" v-if="word">
            <section class="content" v-bar>
                <transition-group name="list" tag="div">
                    <div
                        v-for="[wordbook, definition] in definitions"
                        :key="wordbook.id"
                        class="uk-margin-small-bottom"
                    >
                        <component
                            :is="wordbook.id"
                            :id="wordbook.id"
                            :word="word"
                            :definition="definition"
                            :wordbook="wordbook"
                        ></component>
                    </div>
                </transition-group>
            </section>

            <aside class="sidebar cm-scrollbar">
                <ul class="headings">
                    <li v-for="wordbook in wordbooks" :key="wordbook.id" class="heading">
                        <a :href="`#${wordbook.id}`" class="anchor" v-if="definitionExists(wordbook)">{{
                            wordbook.name
                        }}</a>
                        <span v-else class="anchor uk-text-muted">{{ wordbook.name }}</span>
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

import CollectionStateMixin from '@/mixins/collection-state-mixin';

import { CollectionWord } from '../../store/modules/collection/index';
import { DragObject, DragTarget } from '@/am-drag.plugin';
import { Definition, Wordbook } from '@/api/wordbook';

import SourceViewV from '@/components/editor/source-view.vue';
import '@/components/wordbook'; // import to register all the workbooks with the store

Vue.component('source-view', SourceViewV);

const display = namespace('display');

@Component
export default class WordList extends mixins(CollectionStateMixin) {
    @Prop()
    id: string;

    // #region Display store

    @display.State word: CollectionWord[];
    @display.State definitions: [Wordbook, Definition][];
    @display.State wordbooks: Wordbook[];

    // #endregion Display store

    /**
     * Check if a word definition was loaded for the provided wordbook.
     */
    definitionExists(wordbook: Wordbook): boolean {
        return this.definitions.some(([wb, de]) => wb.id === wordbook.id);
    }

    async mounted(): Promise<void> {
        /* this.editor = new Quill('#editor');

        this.editor.on('text-change', () => {
            console.log('???');

            this.raw = this.editor.root.innerHTML;
        }); */
        /* if (!this.id) {
            return;
        }

        anki.retrieveMediaFile('earth_global_circulation1_-_en.svg.png').then((data: any) => {
            //console.log(data);
        });

        this.modelFields = await anki.getModelFieldNames('Word Vault');

        this.notes = await anki.findNotes('English::Word Vault', 'Word', this.word!.text);
        this.noteFields = await anki.getFields(this.notes[0]); */
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

    onOut(event: MouseEvent, dragObject: DragObject, dragTarget: DragTarget): void {
        console.log('out', event, dragObject);
        this.$el.classList.remove('drag-over');
    }

    onDrop(event: MouseEvent, dragObject: DragObject, dragTarget: DragTarget): void {
        console.log('drop', event, dragObject, dragTarget);

        dragTarget.node.appendChild(dragObject.clone);
    }
}
</script>

<style lang="scss" scoped>
// TODO: quill is not used right now
// @import '~quill/dist/quill.core.css';
@import './../../styles/variables';

.list-enter-active,
.list-leave-active {
    transition: all 0.3s;
}

.list-enter, .list-leave-to_ /* .list-leave-active below version 2.1.8 */ {
    opacity: 0;
    transform: translateY(3px);
}

.list-leave-to {
    opacity: 0;
    // transform: translateY(-3px);
}

.drag-target-active {
    //.drag-over {
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
        padding-right: 0rem;

        .source-view {
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

                &.uk-text-muted {
                    font-weight: normal;
                }
            }
        }
    }
}
</style>
