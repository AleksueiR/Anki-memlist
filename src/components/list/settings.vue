<template>
    <el-dialog title="Settings" :visible="isOpen" :before-close="close" size="small">
        <el-row>
            <el-col :span="24">
                <el-form label-position="left" label-width="100px">
                    <el-form-item label="Acess Token">
                        <el-input v-model="gistToken"></el-input>
                    </el-form-item>
                    <el-form-item label="Gist ID">
                        <el-input v-model="gistId"></el-input>
                    </el-form-item>
                    <el-form-item label="File Name">
                        <el-input v-model="gistFileName"></el-input>
                    </el-form-item>
                </el-form>
            </el-col>
        </el-row>
    </el-dialog>
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
import * as settings from './../../settings';

@Component
export default class Settings extends Vue {
    @Prop() isOpen: boolean;

    close(): void {
        this.$emit('update:isOpen', false);
    }

    get gistToken(): string {
        return settings.storage.get(settings.gistTokenKey, '') as string;
    }

    set gistToken(value: string) {
        settings.storage.set(settings.gistTokenKey, value);
    }

    get gistId(): string {
        return settings.storage.get(settings.gistIdKey, '') as string;
    }

    set gistId(value: string) {
        settings.storage.set(settings.gistIdKey, value);
    }

    get gistFileName(): string {
        return settings.storage.get(settings.gistFileNameKey, '') as string;
    }

    set gistFileName(value: string) {
        settings.storage.set(settings.gistFileNameKey, value);
    }

    mounted(): void {
        // give DOM time to paint
        // setTimeout((<HTMLElement>this.$refs['gist-token']).focus, 50);
    }
}
</script>

<style lang="scss" scoped>

</style>


