<template>
    <el-dialog title="Settings" :visible="isOpen" :before-close="close" @open="updateForm">
        <el-row>
            <el-col :span="24">
                <el-form label-position="left" label-width="120px" :model="form" :rules="rules" ref="form">
                    <el-form-item label="Acess Token" prop="gist_token">
                        <el-input v-model="form.gist_token"></el-input>
                    </el-form-item>
                    <el-form-item label="Gist ID" prop="gist_id">
                        <el-input v-model="form.gist_id" ></el-input>
                    </el-form-item>
                    <el-form-item label="File Name" prop="gist_fileName">
                        <el-input v-model="form.gist_fileName" ></el-input>
                    </el-form-item>

                    <el-form-item>
                        <el-button type="primary" @click="saveSettings()">Save</el-button>
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

import { cOpenSettings } from './../../store/modules/app';
import { Setting } from './../../settings';

import {
    gistTokenSetting,
    gistIdSetting,
    gistFileNameSetting
} from './../../settings';

interface SettingFrom {
    gist_id: string;
    gist_token: string;
    gist_fileName: string;
    [key: string]: string;
}

@Component
export default class Settings extends Vue {
    @Prop() isOpen: boolean;

    formItems: Setting[] = [
        gistTokenSetting,
        gistIdSetting,
        gistFileNameSetting
    ];

    private form_: SettingFrom;

    get form(): SettingFrom {
        console.log('get form');
        return this.form_;
    }

    created(): void {
        this.updateForm();
    }

    updateForm(): void {
        this.form_ = {
            gist_id: gistIdSetting.get(),
            gist_token: gistTokenSetting.get(),
            gist_fileName: gistFileNameSetting.get()
        };
    }

    close(): void {
        cOpenSettings(this.$store, false);
    }

    get gistToken(): string {
        return gistTokenSetting.get();
    }

    set gistToken(value: string) {
        gistTokenSetting.set(value);
    }

    get gistId(): string {
        return gistIdSetting.get();
    }

    set gistId(value: string) {
        gistIdSetting.set(value);
    }

    get gistFileName(): string {
        return gistFileNameSetting.get();
    }

    set gistFileName(value: string) {
        gistFileNameSetting.set(value);
    }

    mounted(): void {
        console.log('fomr mount');
        // [gistTokenSetting, gistIdSetting, gistFileNameSetting]
        // give DOM time to paint
        // setTimeout((<HTMLElement>this.$refs['gist-token']).focus, 50);
    }

    saveSettings(): void {
        (<any>this.$refs['form']).validate((valid: boolean) => {
            if (valid) {
                console.log('---> submit!!');

                this.formItems.forEach(formItem =>
                    formItem.set(this.form[formItem.safeKey])
                );
                this.close();
            } else {
                console.log('<--- error submit!!');
                return false;
            }
        });
    }

    rules = {
        gist_token: [
            {
                required: true,
                message: 'Git Access token required',
                trigger: 'change'
            },
            {
                len: 40,
                message: 'Git Access token should be 40 characters long',
                trigger: 'change'
            }
        ],
        gist_id: [
            {
                required: true,
                message: 'Gist Id required',
                trigger: 'change'
            },
            {
                len: 32,
                message: 'Git Id should be 40 characters long',
                trigger: 'change'
            }
        ],
        gist_fileName: [
            {
                required: true,
                message: 'Gist File Name required',
                trigger: 'change'
            }
        ]
    };
}
</script>

<style lang="scss" scoped>

</style>
