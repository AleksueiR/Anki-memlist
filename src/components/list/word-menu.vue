<template>
    <el-dropdown trigger="click">
        <el-button type="primary" icon="menu"></el-button>
        <el-dropdown-menu slot="dropdown">
            <el-dropdown-item @click.native="isSettingsOpen = true">Settigns</el-dropdown-item>
            <el-dropdown-item @click.native="isImportOpen = true">Bulk Import</el-dropdown-item>
        </el-dropdown-menu>

        <settings :isOpen.sync="isSettingsOpen"></settings>
        <bulk-import :isOpen.sync="isImportOpen"></bulk-import>
    </el-dropdown>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import settings from './settings.vue';
import bulkimport from './bulk-import.vue';

@Component({
    components: {
        settings,
        'bulk-import': bulkimport
    }
})
export default class WordMenu extends Vue {
    isSettingsOpen: boolean = false;
    isImportOpen: boolean = false;
}
</script>

<style lang="scss" scoped>

</style>


