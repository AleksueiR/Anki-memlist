import Vue from 'vue';

import { TreeDragItem, TreeDropTarget, TreeeDropPosition } from './treee.vue';

export default class Treee extends Vue {
    dragItem: TreeDragItem | null;
    dropTarget: TreeDropTarget | null;
}
