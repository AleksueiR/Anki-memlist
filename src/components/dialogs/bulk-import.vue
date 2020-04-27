<template>
    <div>
        blah
    </div>
    <!-- <el-dialog
        title="Import"
        :visible.sync="isOpen"
        :before-close="close"
        size="small">
        <el-row>
            <el-col :span="24">
                <el-input
                    ref="bulk-import"
                    type="textarea"
                    :rows="12"
                    placeholder="New Words"
                    v-model="bulkValue"
                    @keyup.native.ctrl.enter="addBulkLines">
                </el-input>
                <span>{{ bulkHint }}</span>
            </el-col>
        </el-row>
        <div slot="footer" class="dialog-footer">
            <el-button @click="close">Cancel</el-button>
            <el-button type="primary" @click="addBulkLines" :disabled="!isBulkImportValid">Import</el-button>
        </div>
    </el-dialog> -->
</template>

<script lang="ts">
import { Vue, Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

// import { cOpenImport } from './../../store/modules/app';

// import { Word, dSyncWords, cAddWord, rItems } from './../../store/modules/words';

@Component
export default class BulkImport extends Vue {
    /* @Prop() isOpen: boolean;

    bulkValue: string = '';

    close(): void {
        this.bulkValue = '';
        cOpenImport(this.$store, false);
    }

    addBulkLines(): void {
        if (!this.isBulkImportValid) {
            return;
        }

        this.bulkLines.filter(line => !this.bulkDuplicates.includes(line)).forEach(line => {
            console.log(line);
            const word: Word = new Word({ text: line });
            cAddWord(this.$store, word);
        });

        dSyncWords(this.$store);
        this.close();
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

        return this.bulkValue
            .split('\n')
            .map(line => line.trim())
            .filter(line => line);
    }

    get bulkDuplicates(): string[] {
        if (!this.bulkValue) {
            return [];
        }

        const existingWords: Word[] = rItems(this.$store);

        const duplicates = this.bulkLines.filter(line => existingWords.find(word => word.text === line.trim()));

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
            return `Found ${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''}; ${newWordCount} new word${
                newWordCount > 1 ? 's' : ''
            }.`;
        } else if (lineCount > 0) {
            return `${lineCount} new word${newWordCount > 1 ? 's' : ''}.`;
        }

        return '';
    } */
}
</script>

<style lang="scss" scoped></style>
