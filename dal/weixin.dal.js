const http = require('../drivers/http');
const settings = require('../settings');
const common = require('../includes/common');

const __stg = settings.interface.weixin;

function Call(params, cb)
{
    params = common.Extend(params, __stg.common_params);
    const url = common.SetURIParams(__stg.url, params);
    http.Call(url, null, {}, null, (err, dat) =>
    {
        if (err)
        {
            return cb(err);
        }

        cb(null, dat);
    });
}

module.exports = {
    Authenticate: (code, cb) =>
    {
        Call({
            grant_type: 'authorization_code',
            js_code: code
        }, cb);
    }
};
