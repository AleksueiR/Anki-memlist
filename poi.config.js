module.exports = {
    presets: [
        require('poi-preset-typescript')({
            loaderOptions: {
                appendTsSuffixTo: [/\.vue$/]
            }
        })
    ],
    extendWebpack(config) {
        config.resolve.alias
            .set('vue$', 'vue/dist/vue.esm.js'); // vue.esm include template compiler; without it all templates need to be pre-compiled

        config.output
            .set('library', 'DQV');
    }
};