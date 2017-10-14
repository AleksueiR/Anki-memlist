<template>
    <div class="quill-wrapper">
        <h5>{{ fieldName }}</h5>
        <div ref="editor"></div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import Quill from './quill';

@Component
export default class QuillEditor extends Vue {
    @Prop()
    initialHTML: string;

    @Prop()
    fieldName: string;

    quill: Quill;

    @Watch('initialHTML')
    onInitialHTMLChanged(val: string, oldVal: string) {
        this.quill.clipboard.dangerouslyPasteHTML(this.initialHTML);
    }

    mounted(): void {

        this.quill = new Quill(this.$refs['editor'] as HTMLElement, {
            modules: {
                toolbar: [
                    [{ header: [1, 2, false] }],
                    ['bold', 'italic', 'underline'],
                    ['image', 'code-block'],
                    ['clean']
                ]
            },
            placeholder: 'Compose an epic...',
            theme: 'snow'  // or 'bubble'
        });
    }
}

</script>

<style lang="scss" scoped>
@import url("~quill/dist/quill.snow.css");

h5 {
    font-weight: normal;
    margin: 0;
}

.quill-wrapper {
    margin-bottom: 16px;
}

.ql-container {
    font-size: 16px;
}

</style>


