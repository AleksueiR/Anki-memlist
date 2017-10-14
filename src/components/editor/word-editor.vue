<template>
    <div v-if="word">
        <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/list' }">word list</el-breadcrumb-item>
            <el-breadcrumb-item>{{ word.text }}</el-breadcrumb-item>
        </el-breadcrumb>

        <el-row :gutter="20">
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

    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import storage from './../../api/jsonbin';
import anki from './../../api/anki';

import QuillEditor from './editor/../quill-editor.vue';
import VASource from './../../sources/va.vue';

import { Word, dFetchWods, dSyncWords, rItems } from './../../store/modules/words';

@Component({
    components: {
        'va-source': VASource,
        'quill-editor': QuillEditor
    }
})
export default class WordList extends Vue {
    @Prop()
    id: string;

    activeTab: string = 'first';

    raw: string = '';

    get word(): Word | undefined {
        return rItems(this.$store).find(item => item.id === this.id);
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

        })

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

}
</script>

<style lang="scss" scoped>
@import "~quill/dist/quill.core.css";

</style>


