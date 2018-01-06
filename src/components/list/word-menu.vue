<template>
    <el-dropdown trigger="click">
        <el-button type="primary" icon="el-icon-menu"></el-button>
        <el-dropdown-menu slot="dropdown">
            <el-dropdown-item @click.native="openSettings($store, true)">Settigns</el-dropdown-item>
            <el-dropdown-item @click.native="openImport($store, true)">Bulk Import</el-dropdown-item>
        </el-dropdown-menu>

    </el-dropdown>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';

import settings from './../dialogs/settings.vue';
import bulkimport from './../dialogs/bulk-import.vue';

import { cOpenSettings, cOpenImport } from './../../store/modules/app';

@Component({
    components: {
        settings,
        'bulk-import': bulkimport
    }
})
export default class WordMenu extends Vue {
    openSettings(): void {
        cOpenSettings(this.$store, true);
    }

    openImport(): void {
        cOpenImport(this.$store, true);
    }
}
</script>

<style lang="scss" scoped>

</style>


