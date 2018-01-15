<template>
    <div class="container" v-if="collection.length > 0">

            <!-- {{ from }} {{ to }} {{ limit }} {{ collection.length }} -->
            <div class="controls" v-if="total !== 1">
                <el-button @click="back" :disabled="current === 1"><font-awesome-icon icon="angle-up" /></el-button>

                <span class="page current">{{ current }}</span>
                <span class="divider"></span>
                <span class="page total">{{ total }}</span>

                <el-button @click="next" :disabled="current === total"><font-awesome-icon icon="angle-down" /></el-button>
            </div>

            <div class="example-list" v-if="collection.length > 0">
                <li v-for="(example, index) in collection.slice(from, to)" :key="`example-${index}`" class="example-item">
                    <p v-html="example"></p>
                </li>
            </div>

        </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';
import FontAwesomeIcon from '@fortawesome/vue-fontawesome';

/* import { Definition } from './../../sources/source.class';
import { Word } from './../../store/modules/words'; */

@Component({
    components: {
        FontAwesomeIcon
    }
})
export default class SourceView extends Vue {
    @Prop() collection: string[];
    @Prop({ default: 3 })
    limit: number | null;
    from: number = 0;

    @Watch('collection')
    onCollectionChange(): void {
        // reset to start when the example collection changes
        this.from = 0;
    }

    get current(): number {
        return Math.ceil(this.to / (this.limit || this.to));
    }

    get total(): number {
        return Math.ceil(
            this.collection.length / (this.limit || this.collection.length)
        );
    }

    get to(): number {
        if (this.limit === null) {
            return this.collection.length;
        }

        return Math.min(this.from + this.limit, this.collection.length);
    }

    next(): void {
        console.log('dsf up');
        if (this.limit === null || this.to - this.from < this.limit) {
            return;
        }
        this.from = Math.min(
            this.collection.length - 1,
            Math.max(this.from + this.limit, 0)
        );
    }

    back(): void {
        console.log('dsf down up');
        if (this.limit === null) {
            return;
        }
        this.from = Math.min(
            this.collection.length - 1,
            Math.max(this.from - this.limit, 0)
        );
    }

    playSound(event: MouseEvent): void {
        console.log(event);
        (<HTMLAudioElement>(<HTMLElement>event.currentTarget)
            .firstElementChild).play();
    }
}
</script>

<style lang="scss" scoped>
.container {
    display: flex;
}

.controls {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    margin: 0;
    align-items: center;

    button {
        border-color: transparent;
        background-color: transparent;
        padding: 0;
        width: 1em;
        font-size: 1.2em;

        &:first-child {
            padding-bottom: 0.5em;
        }

        &:last-child {
            padding-top: 0.5em;
        }
    }

    .page {
        color: rgb(102, 102, 102);
        line-height: 1rem;

        &.current {
            font-weight: bold;
            font-size: 0.8em;
        }

        &.total {
            font-size: 0.6em;
        }
    }

    .divider {
        height: 1px;
        border-top: solid rgb(175, 175, 175) 1px;
        width: 1em;
        display: block;
        margin: 0.3em 0;
    }
}

.example-list {
    flex: 1;
    margin: 0 0 0 1em;
    font-family: Courier New, Courier, monospace;

    .example-item {
        margin: 0 0 0.5em 0;

        p {
            margin: 0;
        }
    }
}
</style>


