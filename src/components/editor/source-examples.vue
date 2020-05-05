<template>
    <div class="container" v-if="collection.length > 0">
        <!-- {{ from }} {{ to }} {{ limit }} {{ collection.length }} -->
        <div class="controls" v-if="total !== 1" @mousedown="engage">
            <button
                v-for="(page, index) in total"
                :key="index"
                class="page-button"
                :class="{ selected: index === current }"
                @click="current = index"
                @mouseover="onMouseOverHandler(index)"
            ></button>
        </div>

        <ul class="example-list" v-if="collection.length > 0">
            <li v-for="(example, index) in sortedCollection.slice(from, to)" :key="`example-${index}`" class="example-item">
                <p v-html="example"></p>
            </li>
        </ul>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

@Component
export default class SourceView extends Vue {
    @Prop()
    collection: string[];

    @Prop({ default: 3 })
    limit: number | null;

    isEngaged: boolean = false;

    @Watch('collection')
    onCollectionChange(): void {
        // reset to start when the example collection changes
        this.current = 0;
    }

    /**
     * A sample collection sorted by sample length, from shortest to longest.
     */
    get sortedCollection(): string[] {
        return this.collection.slice().sort((a, b) => (a.length < b.length ? -1 : 1));
    }

    current: number = 0;

    get total(): number {
        return Math.ceil(this.collection.length / (this.limit || this.collection.length));
    }

    get from(): number {
        return this.limit ? this.current * this.limit : 0;
    }

    get to(): number {
        if (this.limit === null) {
            return this.collection.length;
        }

        return Math.min(this.from + this.limit, this.collection.length);
    }

    /**
     * Engages the sample navigation controls. Mouse movements over the control elements will automatically update the currently visible samples.
     */
    engage(): void {
        this.isEngaged = true;

        document.addEventListener('mouseup', this.disengage);
    }

    /**
     * Stops tracking mouse movements when the mouse button is released. This can happen outside of the component, so a global listener is needed.
     */
    disengage(): void {
        this.isEngaged = false;

        document.removeEventListener('mouseup', this.disengage);
    }

    onMouseOverHandler(index: number): void {
        if (!this.isEngaged) {
            return;
        }

        this.current = index;
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

$default-colour: $secondary-colour;
$hover-colour: rgba(
    $color: $accent-colour,
    $alpha: 0.4
);
$select-colour: rgba(
    $color: $accent-colour,
    $alpha: 0.7
);
.container {
    display: flex;
}
.controls {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    margin: 0;
    align-items: center;
    .page-button {
        width: 1.8em;
        height: 8px;
        position: relative;
        border: none;
        background: transparent;
        padding: 0;
        cursor: pointer;
        &:last-child {
            margin-bottom: 0;
        }
        &:last-child {
            margin-bottom: 0;
        }
        &:after {
            content: '';
            position: absolute;
            top: 1px;
            bottom: 2px;
            left: 0;
            right: 0;
            background: $default-colour;
        }
        &:hover:after {
            background: $hover-colour;
        }
        &.selected:after {
            background: $select-colour;
        }
        &:focus {
            outline: none;
        }
    }
}
.example-list {
    flex: 1;
    margin: 0 0 0 1em;
    font-family: Consolas;
    list-style: none;
    padding: 0;

    .example-item {
        margin: 0 0 0.5em 0;
        p {
            margin: 0;
        }
    }
}
</style>
