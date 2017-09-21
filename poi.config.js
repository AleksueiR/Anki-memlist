module.exports = {
    presets: [
        require('poi-preset-typescript')({}),
        require('poi-preset-karma')({
            port: 5001, // default
            files: ['test/unit/*.test.ts'], // default,
        })
    ],
    extendWebpack(config) {
        //config.resolve.alias
        //    .set('vue$', 'vue/dist/vue.esm.js'); // vue.esm include template compiler; without it all templates need to be pre-compiled

        /*config.output
            .set('library', 'DQV');*/

        // config.set('devtool', '#source-map');

        //console.log(config);
    },
    karma: {
        mime: {
            'text/x-typescript': ['ts']
        }
    }
};