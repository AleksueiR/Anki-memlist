<template>
    <div>
        <v-menu
            offset-y>
            <v-btn icon slot="activator">
                <v-icon>mdi-menu</v-icon>
            </v-btn>
            <v-list>
                <v-list-tile v-for="item in items" :key="item.name" @click="item.action()">
                    <v-list-tile-title>{{ item.name }}</v-list-tile-title>
                </v-list-tile>
                <!--<v-divider></v-divider>
                <v-list-tile>
                    <v-list-tile-action>
                        <v-switch v-model="message" color="purple"></v-switch>
                    </v-list-tile-action>
                    <v-list-tile-title>Enable messages</v-list-tile-title>
                </v-list-tile> -->
            </v-list>
        </v-menu>
        <v-dialog v-model="bulkImportDialog" transition="dialog-bottom-transition" content-class="elevation-2 square">
            <v-card>
                <v-card-text>
                    <v-container grid-list-md>
                        <v-layout wrap>
                            <v-text-field
                                ref="bulk-import"
                                name="bulk-import"
                                label="New Words"
                                v-model="bulkValue"
                                :hint="bulkHint"
                                @keyup.esc="openBulkImport(false)"
                                @keyup.ctrl.enter="addBulkLines()"
                                rows="12"
                                multi-line></v-text-field>
                        </v-layout>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey darken-1" flat="flat" @click="openBulkImport(false)">Close</v-btn>
                    <v-btn color="green darken-1" flat="flat" :disabled="!isBulkImportValid" @click="addBulkLines()">Import</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="settingsDialog" transition="dialog-bottom-transition" content-class="elevation-2 square"
            width="500"
            scrollable>
            <v-card>
                <v-card-text>
                    <settings></settings>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="black" flat="flat" @click="openSettings(false)">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import { Word, dSyncWords, cAddWord, rItems } from './../../store/modules/words';

import settings from './../settings.vue';

@Component({
    components: {
        settings
    }
})
export default class WordMenu extends Vue {
    bulkImportDialog: boolean = false;
    bulkValue: string = '';

    settingsDialog: boolean = false;

    items = [
        {
            name: 'Bulk Import',
            action: this.openBulkImport
        },
        {
            name: 'Settings',
            action: this.openSettings
        }
    ];

    openSettings(value = !this.settingsDialog): void {
        this.settingsDialog = value;
    }

    openBulkImport(value = !this.bulkImportDialog): void {
        this.bulkImportDialog = value;
        this.bulkValue = '';

        if (!value) {
            return;
        }

        // give DOM time to paint
        setTimeout((<HTMLElement>this.$refs['bulk-import']).focus, 50);
    }

    addBulkLines(): void {
        if (!this.isBulkImportValid) {
            return;
        }

        this.bulkLines
            .filter(line => !this.bulkDuplicates.includes(line))
            .forEach(line => {
                console.log(line);
                const word: Word = new Word({ text: line });
                cAddWord(this.$store, word);
            });

        dSyncWords(this.$store);
        this.openBulkImport(false);
    }

    get isBulkImportValid(): boolean {
        if (!this.bulkValue) {
            return false;
        }

        return this.bulkDuplicates.length !== this.bulkLines.length;
    }

    get bulkLines(): string[] {
        if (!this.bulkValue) {
            return [];
        }

        return this.bulkValue.split('\n')
            .map(line => line.trim())
            .filter(line => line);
    }

    get bulkDuplicates(): string[] {
        if (!this.bulkValue) {
            return [];
        }

        const existingWords: Word[] = rItems(this.$store);

        const duplicates = this.bulkLines
            .filter(line =>
                existingWords.find(word => word.text === line.trim()));

        return duplicates;
    }

    get bulkHint(): string {
        if (!this.bulkValue) {
            return '';
        }
        const duplicateCount = this.bulkDuplicates.length;
        const lineCount = this.bulkLines.length;
        const newWordCount = lineCount - duplicateCount;

        if (duplicateCount > 0) {
            return `Found ${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''}; ${newWordCount} new word${newWordCount > 1 ? 's' : ''}.`;
        } else if (lineCount > 0) {
            return `${lineCount} new word${newWordCount > 1 ? 's' : ''}.`;
        }

        return '';
    }
}
</script>

<style lang="scss" scoped>
.square {
    border-radius: 0;
}
</style>


