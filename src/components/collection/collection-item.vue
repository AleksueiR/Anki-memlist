<template>
    <div class="collection-item">

        <span
            class="icon-button default-flag"
            @click.stop="onBookmarkClick"
            v-if="item.listId === defaultListId">
            <font-awesome-icon icon="bookmark" />
        </span>

        <!-- <button
            class="icon-button default-flag"
            @click.stop="onBookmarkClick"
            v-if="item.listId === defaultListId">
            <font-awesome-icon icon="bookmark" />
        </button> -->

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
import FontAwesomeIcon from '@fortawesome/vue-fontawesome';

import {
    CollectionList,
    CollectionTree,
    CollectionState
} from '../../store/modules/collection/index';

const StateCL = namespace('collection', State);
const ActionCL = namespace('collection', Action);

@Component({
    components: {
        FontAwesomeIcon
    }
})
export default class CollectionItem extends Vue {
    @Prop() item: CollectionTree;

    @StateCL lists: Map<string, CollectionList>;
    @StateCL((state: CollectionState) => state.index.defaultListId)
    defaultListId: string;

    get list(): CollectionList {
        return this.lists.get(this.item.listId)!;
    }

    onBookmarkClick(): void {}
}
</script>

<style lang="scss" scoped>
@import './../../styles/variables';

.collection-item {
    height: 1.5rem;
    display: flex;
    align-items: center;
    // margin: 0 0.5rem 0 0.5rem;

    margin-left: 1.5rem;

    span {
        line-height: 1.5rem;
    }
}

.meti {
}

.icon-button {
    color: $even-darker-secondary-colour;
    border: none;
    background: transparent;
    padding: 0;
    margin: 0;
}

.default-flag {
    color: $primary-colour;
    display: flex;
    align-items: center;
    justify-content: center;

    cursor: default !important;
}

.pin-flag,
.default-flag {
    position: absolute;
    left: 0;
}

.icon-button {
    font-size: 0.8rem;
    cursor: pointer;
    width: 1.5rem;
    height: 1.5rem;
}
</style>
