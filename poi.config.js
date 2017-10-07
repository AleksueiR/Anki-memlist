const pkg = require("./package.json");

module.exports = {
    html: {
        title: pkg.productName || pkg.name,
        description: pkg.description,
        template: 'src/index.ejs'
    },
    presets: [
        require('poi-preset-babel-minify')(),
        require('poi-preset-typescript')({}),
        require('poi-preset-karma')({
            port: 5001, // default
            files: ['test/unit/*.test.ts'], // default,
        })
    ],
    extendWebpack(config) {
        config.target('electron-renderer');

        config.node
            .set('__filename', false)
            .set('__dirname', false);
    },
    karma: {
        mime: {
            'text/x-typescript': ['ts']
        }
    }
};