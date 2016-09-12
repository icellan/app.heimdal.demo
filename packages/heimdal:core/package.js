Package.describe({
    summary: 'Heimdal core package.',
    version: '0.0.1',
    name: 'heimdal:core',
    git: ''
});

Package.on_use(function (api) {
    api.versionsFrom("1.2.0.2");

    api.use([
        'mongo',
        'ecmascript',
        'underscore',
        'session',
        'random',
        'accounts-base',
        'accounts-password',
        'momentjs:moment@2.11.1',
        'flemay:less-autoprefixer@1.2.0',
        'aldeed:collection2@2.7.0',
        'aldeed:simple-schema@1.5.3'
    ]);

    // shared
    api.addFiles([
        'lib/shared.js',
        'lib/encryption.js',
        'lib/parseUri.js'
    ]);

    // server
    api.addFiles([
        'server/methods.js'
    ], 'server');

    // client
    api.addFiles([
        'client/startup.js'
    ], 'client');

    api.export([
        'Heimdal'
    ]);
});
