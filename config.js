// # Ghost Configuration
var path = require('path'),
    config;

config = {

    production: {
        url: 'http://localhost:2368',               // if needed change localhost to your "domain.com"
        // mail: {},
        database: {
            client: 'postgres',
            connection: process.env.DATABASE_URL,   // waiting on https://github.com/TryGhost/Ghost/issues/7177
            debug: false
        },

        server: {
            host: '0.0.0.0',
            port: '2368'
        },
        // #### Paths
        // Specify where your content directory lives
        paths: {
            contentPath: path.join(process.env.GHOST_CONTENT, '/')
        }
    }
};

module.exports = config;
