<template>
    <div class="collection-item">
        <span class="meti">{{ list.name }} [{{ list.id }}] {{ list.index.length }}</span>
    </div>
</template>

<script lang="ts">
import {
    Vue,
    Component,
    Inject,
    Model,
    Prop,
    Watch
} from 'vue-property-decorator';
import { State, Getter, Action, Mutation, namespace } from 'vuex-class';

import {
    CollectionList,
    CollectionTree
} from '../../store/modules/collection/index';

const StateCL = namespace('collection', State);
const ActionCL = namespace('collection', Action);

@Component
export default class CollectionItem extends Vue {
    @Prop() item: CollectionTree;

    @StateCL lists: Map<string, CollectionList>;

    get list(): CollectionList {
        return this.lists.get(this.item.listId)!;
    }
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.collection-item {
    height: 26px;
    display: flex;
    align-items: center;
    // margin: 0 0.5rem 0 0.5rem;
}

.meti {
}
</style>
