<template>
    <div>
        <h5>{{ word.text }}</h5>
        <v-container grid-list-md fluid>
            <v-layout row>
                <v-flex xs6>
                    <div id="editor"></div>

                    raw
                    {{ raw }}
                </v-flex>
                <v-flex xs6>
                    two
                    <div>
                        <va-source :word="word"></va-source>
                    </div>
                </v-flex>
            </v-layout>
        </v-container>

        word-editor word id {{ id }} {{ word }}

    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import Quill from './../quill';

import storage from './../api/jsonbin';
import anki from './../api/anki';

import VASource from './../sources/va.vue';

import { Word, dFetchWods, dSyncWords, rItems } from './../store/modules/words';

@Component({
    components: {
        'va-source': VASource
    }
})
export default class WordList extends Vue {
    @Prop()
    id: string;

    editor: Quill;
    raw: string = '';

    get word(): Word | undefined {
        return rItems(this.$store).find(item => item.id === this.id);
    }

    mounted(): void {
        this.editor = new Quill('#editor');

        this.editor.on('text-change', () => {
            console.log('???');

            this.raw = this.editor.root.innerHTML;
        });
    }
}
</script>

<style lang="scss" scoped>
@import "~quill/dist/quill.core.css";

#editor {
    height: 200px;
}

</style>


