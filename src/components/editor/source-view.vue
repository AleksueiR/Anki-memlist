<template>
    <section class="wordbook">
        <h2 class="title">
            <span class="name">{{ wordbook.name }}</span
            ><span class="divider"></span>
        </h2>

        <slot name="before-group-list"></slot>

        <ul class="group-list">
            <li v-for="(group, index) in definition.groups" :key="`group-${index}`" class="group-item">
                <h3 class="group-title">
                    <span class="word"
                        >{{ word.text
                        }}<span class="sup" v-if="definition.groups.length > 1">{{ index + 1 }}</span></span
                    >

                    <span
                        v-for="(pronunciation, index) in group.pronunciations"
                        :key="`pronunciation-${index}`"
                        class="pronunciation"
                    >
                        <span v-if="pronunciation.part">{{ pronunciation.part }}.</span>

                        <span v-if="pronunciation.spellings.length > 0" class="spelling">
                            <span v-for="(spelling, index) in pronunciation.spellings" :key="`spelling-${index}`"
                                ><span v-if="index !== 0">, </span
                                ><span class="spelling-item">{{ spelling }}</span></span
                            >
                        </span>

                        <span class="speaker" v-if="pronunciation.audios.length > 0">
                            <a
                                v-for="(audio, index) in pronunciation.audios"
                                :key="`audio-${index}`"
                                @click.stop.prevent="playSound"
                                @click.right.stop.prevent="downloadSound(audio)"
                            >
                                <audio ref="player" controls :src="audio"></audio> <i class="el-icon-service"></i>
                            </a>
                        </span>
                    </span>
                </h3>

                <!-- main definition section -->
                <div v-for="(part, index) in group.parts" :key="`part-${index}`" class="part">
                    <span class="part-designator" :class="part.name">{{ part.name }}</span>

                    <ul class="sense-list">
                        <li v-for="(sense, senseIndex) in part.senses" :key="`sense-${senseIndex}`" class="sense-item">
                            <span class="sense-index">{{ senseIndex + 1 }}</span>

                            <div class="sense-content">
                                <p class="sense-definition-block">
                                    <span v-if="sense.grammaticalNote" class="sense-gram-note"
                                        >[{{ sense.grammaticalNote }}]</span
                                    >
                                    <span v-if="sense.senseRegisters" class="sense-registers"
                                        >[{{ sense.senseRegisters }}]</span
                                    >
                                    <span class="sense-definition">{{ sense.definition }}</span>
                                </p>

                                <source-examples :collection="sense.examples" class="source-examples"></source-examples>

                                <!--
                                    <div class="sense-example-list" v-if="sense.examples.length > 0">
                                        <li v-for="(example, index) in sense.examples.slice(0, 3)" :key="`example-${index}`" class="sense-example-item">
                                            <p v-html="example"></p>
                                        </li>
                                    </div>
                                -->

                                <ul class="sense-list subsense-list" v-if="sense.subsenses.length > 0">
                                    <li
                                        v-for="(subsense, subsenseIndex) in sense.subsenses"
                                        :key="`subsense-${subsenseIndex}`"
                                        class="sense-item"
                                    >
                                        <span class="sense-index">{{ senseIndex + 1 }}.{{ subsenseIndex + 1 }}</span>

                                        <div class="sense-content">
                                            <p class="sense-definition-block">
                                                <span v-if="subsense.grammaticalNote" class="sense-gram-note"
                                                    >[{{ subsense.grammaticalNote }}]</span
                                                >
                                                <span v-if="subsense.senseRegisters" class="sense-registers"
                                                    >[{{ subsense.senseRegisters }}]</span
                                                >
                                                <span class="sense-definition">{{ subsense.definition }}</span>
                                            </p>

                                            <source-examples
                                                :collection="subsense.examples"
                                                class="source-examples"
                                            ></source-examples>

                                            <!--
                                                <div class="sense-example-list" v-if="subsense.examples.length > 0">
                                                    <li v-for="(example, index) in subsense.examples.slice(0, 3)" :key="`example-${index}`" class="sense-example-item">
                                                        <p v-html="example"></p>
                                                    </li>
                                                </div>
                                            -->
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </li>
                    </ul>
                </div>

                <section v-if="group.phrases.length > 0" class="extra phrases">
                    <h4 class="title">Phrases</h4>

                    <div v-for="(phrase, index) in group.phrases" :key="`phrase-${index}`" class="phrase">
                        <h5 class="phrase-title">{{ phrase.text }}</h5>

                        <span class="phrase-definition"
                            ><span v-if="phrase.senseRegisters">[{{ phrase.senseRegisters }}]</span>
                            {{ phrase.definition }}</span
                        >

                        <source-examples :collection="phrase.examples" class="source-examples"></source-examples>

                        <!--
                            <div class="sense-example-list" v-if="phrase.examples.length > 0">
                                <li v-for="(example, index) in phrase.examples.slice(0, 3)" :key="`example-${index}`" class="sense-example-item phrase-example">
                                    <p v-html="example"></p>
                                </li>
                            </div>
                        -->
                    </div>
                </section>

                <section v-if="group.notes.length > 0" class="extra notes">
                    <h4 class="title">Notes</h4>

                    <div v-for="(note, index) in group.notes" :key="`note-${index}`" class="note">
                        <h5 class="sub-title">{{ note.title }}</h5>

                        <p v-for="(line, index) in note.lines" :key="`line-${index}`" class="note-line">{{ line }}</p>
                    </div>
                </section>
            </li>
        </ul>

        <slot name="after-group-list"></slot>
    </section>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Inject, Model, Prop, Watch, Emit } from 'vue-property-decorator';

import { Word } from './../../store/modules/words';

import SourceExamples from './source-examples.vue';

import axios from 'axios';
import fs from 'fs';
import tmp from 'tmp';
import electron, { clipboard } from 'electron';
import { Definition, Wordbook } from '@/api/wordbook';
const app = electron.remote.app;

// Axios defaults to the xhrAdapter (XMLHttpRequest) in Electron an no stream is available
// forces axios to use the node adapter
// https://github.com/axios/axios/issues/1474#issuecomment-429095922
axios.defaults.adapter = require('axios/lib/adapters/http');

@Component({
    components: { 'source-examples': SourceExamples }
})
export default class SourceViewV extends Vue {
    @Prop()
    word: Word;

    @Prop()
    definition: Definition;

    @Prop()
    wordbook: Wordbook;

    playSound({ currentTarget }: { currentTarget: HTMLElement }): void {
        // console.log(event);

        const audioElement = currentTarget.firstElementChild as HTMLAudioElement;
        audioElement.play();
        this.downloadSound(audioElement.src);
    }

    async downloadSound(url: string): Promise<void> {
        const response = await axios.get<Buffer>(url, { responseType: 'arraybuffer' });

        console.log(response);

        // https://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript/12900504#12900504
        const extension = url.slice((Math.max(0, url.lastIndexOf('.')) || Infinity) + 1);

        // need to specify temp folder in Electron apps
        // https://github.com/raszi/node-tmp/issues/176
        const tmpobj = tmp.fileSync({
            prefix: `${this.word.text}-`,
            postfix: `.${extension}`,
            dir: app.getPath('temp')
        });

        fs.writeFileSync(tmpobj.fd, new Buffer(response.data));
        clipboard.writeText(tmpobj.name);

        // TODO: do not create multiple files for the same word
        // TODO: need to clean up temporary files after
    }

    // TODO: what is this for?
    /* hasSlot(name: string): boolean {
        return typeof this.$slots[name] !== 'undefined';
    } */
}
</script>

<style lang="scss" scoped>
@import '../../styles/variables';

.wordbook {
    display: flex;
    flex-direction: column;
}

.title {
    display: flex;
    font-weight: 400;
    font-size: 2em;
    margin: 0 0 0 1.5rem;
    align-items: center;

    .name {
        flex-shrink: 0;
    }

    .divider {
        flex: 1;
        border-bottom: 1px solid $very-dark-secondary-colour;
        height: 0.4em;
        margin: 0 1.5rem 0 1em;
    }
}

.group-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.group-item {
    margin-top: 2em;
}

.group-title {
    font-size: 1.5em;
    font-weight: normal;
    background-color: $secondary-colour;
    padding: 0em 1.5rem;
    line-height: 2em;
    margin: 0;
    display: flex;

    .word {
        flex: 1;
    }

    .pronunciation {
        font-size: 1rem;
        margin: 0 1rem;
        position: relative;

        .spelling {
            margin-left: 0.5rem;

            .spelling-item {
                &:before,
                &:after {
                    content: '/';
                }
            }
        }

        .speaker {
            margin-left: 0.5rem;

            a {
                cursor: pointer;
            }
        }

        &:nth-child(1n + 1):after {
            position: absolute;
            top: 9px;
            bottom: 9px;
            content: '';
            right: -1rem;
            width: 1px;
            border-right: 1px solid $dark-secondary-colour;
        }

        &:last-child {
            margin-right: 0;
            &:after {
                display: none;
            }
        }
    }

    .sup {
        position: relative;
        bottom: 0.6em;
        font-size: 0.7em;
        left: 0.1em;
    }
}

.part {
    margin: 1em 1.5em 1.5em 1.5em;
}

.part-designator {
    color: white;
    padding: 0px 4px 2px 4px;
    display: inline-block;
    font-style: italic;
    font-size: 1em;
    line-height: 1.5em;

    // default colour for everything unusual
    background-color: $noun-colour;

    &.noun {
        background-color: $noun-colour;
        &.plural {
            background-color: $plural-noun-colour;
        }
    }

    &.adjective {
        background-color: $adjective-colour;
    }

    &.adverb {
        background-color: $adverb-colour;
    }

    &.verb {
        background-color: $verb-colour;
    }
}

.sense-list {
    list-style: none;
    margin: 1em 0 0;
    padding: 0;
}

.sense-item {
    display: flex;
    flex: 1;
    margin: 0;
    margin: 1em 0 0 0;
}

.sense-index {
    margin-right: 1em;
    color: $light-text-colour;
    font-weight: bold;
}

.sense-content {
    margin: 0;
    flex: 1;

    p {
        margin: 0;
    }

    .sense-definition-block {
    }
}

.source-examples {
    margin: 0.7em 0 0 0em;
}

.sense-example-list {
    margin: 0.7em 0 0 1em;
    font-family: Courier New, Courier, monospace;

    .sense-example-item {
        margin: 0.5em 0 0 0;
    }
}

.subsense-list {
    margin-right: 0.5em;
}

.extra {
    margin: 1em 1.5em 1.5em 1.5em;

    .title {
        margin: 0 0 0.5em 0;
    }

    .sub-title {
        margin: 0.5em 0 0 0;
    }

    .notes {
        .note {
            margin: 0 0 1em 0;
        }
    }
}

audio {
    display: none;
}
</style>
