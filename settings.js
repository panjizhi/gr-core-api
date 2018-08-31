const runtime = require('./runtime');
const common = require('./includes/common');

const platform = {
    debug: {
        server: {
            protocol: 'http',
            port: 1001
        },
        console: {
            protocol: 'https',
            host: 'dev.gerun.mobi',
            path: ''
        },
        assets: {
            host: 'dev.gerun.mobi',
            path: ''
        },
        storage: {
            protocol: 'https',
            host: 'dev.gerun.mobi',
            path: '/storage',
            local: 'storage'
        },
        cookie: {
            path: '/',
            secure: false
        },
        database: {
            mongodb: {
                host: '10.160.193.127',
                port: 27017,
                database: 'gr-core-apis'
            }
        }
    },
    qa: {
        server: {
            protocol: 'http',
            port: 1001
        },
        console: {
            protocol: 'https',
            host: 'dev.gerun.mobi',
            path: ''
        },
        assets: {
            protocol: 'https',
            host: 'dev.gerun.mobi',
            path: ''
        },
        storage: {
            protocol: 'https',
            host: 'dev.gerun.mobi',
            path: '/storage',
            local: 'storage'
        },
        cookie: {
            path: '/',
            secure: false
        },
        database: {
            mongodb: {
                host: 'localhost',
                port: 27017,
                database: 'gr-core-apis'
            }
        }
    },
    release: {
        server: {
            protocol: 'http',
            port: 3000
        },
        console: {
            protocol: 'https',
            host: 'gerun.mobi',
            path: ''
        },
        assets: {
            protocol: 'https',
            host: 'gerun.mobi',
            path: ''
        },
        storage: {
            protocol: 'https',
            host: 'gerun.mobi',
            path: '/storage',
            local: 'storage'
        },
        cookie: {
            path: '/',
            secure: true
        },
        database: {
            mongodb: {
                host: 'localhost',
                port: 27017,
                database: 'gr-core-apis'
            }
        }
    }
};

const settings = {
    sign_key: {
        sms: 'waop4lBu8Fln'
    },
    session: {
        name: 'gr-sid',
        secret: 'RYMS5nCzRtgoXc4d',
        lifetime: 3600,
        saveUninitialized: true,
        resave: true
    },
    interface: {
        weixin: {
            url: 'https://api.weixin.qq.com/sns/jscode2session',
            common_params: {
                appid: 'wx181f65d7992e3bc0',
                secret: '1c0605f060e94c05ea73cb178a91b20d'
            }
        }
    }
};

module.exports = common.Extend(settings, platform[runtime]);
