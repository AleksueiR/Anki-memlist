<template>
    <section class="collection-toolbar">
        <nav class="toolbar uk-flex uk-flex-column">

            <a href=""
                class="toolbar-item uk-icon"
                :class="{ selected: isCollectionViewOpen }"
                @click.prevent="openCollectionView({ value: !isCollectionViewOpen })">
                <octo-icon name="repo" scale="1.5"></octo-icon>
            </a>

        </nav>
    </section>
</template>

<script lang="ts">
import { Vue, Component, Prop, Emit } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';

import AppStateMixin from '@/mixins/app-state-mixin';

@Component
export default class CollectionToolbarV extends mixins(AppStateMixin) {}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

$item-side: 3rem;

.toolbar {
    border-width: 0 1px 0 1px;
    flex-shrink: 0;

    .selected {
        color: $accent-colour;
    }

    .toolbar-item {
        width: $item-side;
        height: $item-side;
    }
}
</style>


