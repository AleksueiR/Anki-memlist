<template>
    <v-container grid-list-md>
        <v-layout column >
            <h2 class="title">Key</h2>

            <h3 class="subheading">Gist</h3>

            <!-- <v-layout row>
                <v-flex xs4>
                    <v-card dark color="primary">
                        <v-card-text>12</v-card-text>
                    </v-card>
                </v-flex>
                <v-flex xs8>
                    <v-card dark color="primary">
                        <v-card-text>12</v-card-text>
                    </v-card>
                </v-flex>
            </v-layout>

            <v-layout row>
                <v-flex xs4 class="body-2">
                    test
                </v-flex>
                <v-flex xs8>
                    field
                </v-flex>
            </v-layout> -->

            <v-text-field label="Acess Token" v-model="gistToken" ref="gist-token"></v-text-field>
            <v-text-field label="Gist ID" v-model="gistId"></v-text-field>
            <v-text-field label="File Name" v-model="gistFileName"></v-text-field>

            <!-- <v-layout row>
                        <v-text-field
                            @focus="isFocused = true"
                            @keyup.enter="addOrEditWord()"
                            @keyup.esc="clearLookup()"
                            label="Lookup"
                            :hint="lookupHint"
                            v-model.trim="lookup"
                            single-line
                            full-width
                            clearable
                            autofocus></v-text-field>
                        <word-menu></word-menu>
                    </v-layout> -->

        </v-layout>
    </v-container>
</template>

<script lang="ts">
import { Vue, Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';
import * as settings from './../settings';

@Component
export default class Key extends Vue {

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
        console.log('---> mounted');

        setTimeout((<HTMLElement>this.$refs['gist-token']).focus, 50);
    }

}
</script>

<style lang="scss" scoped>

</style>


