<template>
    <div class="container">

        <!-- {{ word.text }} -->

        <!-- <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/list' }">word list</el-breadcrumb-item>
            <el-breadcrumb-item>{{ word.text }}</el-breadcrumb-item>
        </el-breadcrumb> -->

        <!-- editor is hidden for now -->
        <el-row :gutter="20" v-if="false">
            <el-col :span="12">
                <!-- <el-tabs v-model="editableTabsValue" type="card" editable @edit="handleTabsEdit">
                    <el-tab-pane
                        v-for="(item, index) in editableTabs"
                        :key="item.name"
                        :label="item.title"
                        :name="item.name"
                    >
                        {{item.content}}
                    </el-tab-pane>
                </el-tabs> -->

                <quill-editor v-for="(modelField, index) in modelFields"
                    :key="modelField"
                    :initialHTML="noteFields[index]"
                    :fieldName="modelField"></quill-editor>

                <!-- <p v-for="(modelField, index) in modelFields" :key="modelField">{{ modelField }} - {{ noteFields[index] }}</p> -->

                {{ notes }}
            </el-col>

            <el-col :span="12">
                <va-source :word="word"></va-source>

            </el-col>
        </el-row>

        <header>
            <h1 class="title" v-if="word">{{ word.text }}</h1>

            <div class="controls">
                <word-menu></word-menu>
            </div>
        </header>

        <div class="null-state" v-if="!word">
            <img src="https://image.flaticon.com/icons/svg/326/326804.svg" />
            <span class="message"><span class="code">undefined</span> is not a word</span>
        </div>

        <section class="container main" v-if="word">
            <section class="content scroll">
                    <div v-for="source in sources" :key="source.id" :id="source.id">
                        <!-- <vocabulary-source :word="word"></vocabulary-source> -->

                        <component :is="source.id" :word="word"></component>
                    </div>
            </section>
            <aside class="sidebar scroll">
                <ul class="headings">
                    <li v-for="source in sources" :key="source.id" class="heading">
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

import anki from './../../api/anki';

import QuillEditor from './editor/../quill-editor.vue';

import sources from './../../sources';

import { EventBus, WORD_SELECTED } from './../../event-bus';

import {
    Word,
    dFetchWods,
    dSyncWords,
    rSelectedItem,
    rItems
} from './../../store/modules/words';
import wordMenu from './../list/word-menu.vue';

@Component({
    components: Object.assign(
        {},
        {
            wordMenu: wordMenu,
            'quill-editor': QuillEditor
        },
        sources
    )
})
export default class WordList extends Vue {
    @Prop() id: string;

    activeTab: string = 'first';

    raw: string = '';

    sources = [
        {
            name: 'Vocabulary.com',
            id: 'vocabulary-source'
        },
        { name: 'Oxford Dictonaries', id: 'oxforddictionaries-source' }
    ];

    // _word: Word | null = null;
    get word(): Word | null {
        return rSelectedItem(this.$store);
        // return rItems(this.$store).find(item => item.id === this.id);
        // return this._word;
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

        anki
            .retrieveMediaFile('earth_global_circulation1_-_en.svg.png')
            .then((data: any) => {
                //console.log(data);
            });

        this.modelFields = await anki.getModelFieldNames('Word Vault');

        this.notes = await anki.findNotes(
            'English::Word Vault',
            'Word',
            this.word!.text
        );
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
}
</script>

<style lang="scss" scoped>
@import '~quill/dist/quill.core.css';

header {
    display: flex;
    align-items: center;
    flex-shrink: 0;

    .controls {
        flex: 1;
        display: flex;
        justify-content: flex-end;
        padding: 1em;
    }
}

.title {
    letter-spacing: 0px;
    font-size: 3em;
    text-transform: none;
    color: black;
    font-weight: 300;
    display: block;
    white-space: nowrap;
    line-height: 64px;
    margin: 0 0 16px 0;
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
        color: #2c3e50;
        font-size: 1.2em;
    }

    .code {
        padding: 0.2em 0.4em;
        margin: 0;
        font-size: 85%;
        background-color: rgba(27, 31, 35, 0.05);
        border-radius: 3px;
    }
}

.main {
    flex-direction: row;

    .content {
        flex: 1;
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
                color: #2c3e50;
                display: block;
                text-decoration: none;

                &:active,
                &:hover {
                    color: #2980b9;
                }
            }
        }
    }
}

.scroll {
    overflow: auto;
    padding-right: 16px;

    &::-webkit-scrollbar {
        width: 5px;
    }

    &::-webkit-scrollbar-thumb {
        background-color: rgba(#666, 0.05);
        transition: all 0.3s ease;
    }

    &:hover::-webkit-scrollbar-thumb {
        background-color: rgba(#666, 0.6);
    }
}
</style>


