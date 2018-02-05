const common = require('../includes/common');
const request = require('superagent');
const logger = require('../includes/log').Create('Interface');

const defaultOptions = {
    method: 'post',
    content_type: 'application/json',
    accept: 'json',
    timeout: 10000,
    log_category: 'default'
};

module.exports = {
    Call: (url, params, conds, opts, cb) =>
    {
        const dopts = common.Extend({}, defaultOptions);
        opts = common.Extend(dopts, opts || {});

        const stsmp = (new Date()).getTime();
        let req = request[opts.method](url);
        req.accept(opts.accept);
        req.timeout(opts.timeout);
        if (params)
        {
            req.send(params);
            req.type(opts.content_type);
        }
        req.end((err, xhr) =>
        {
            const etsmp = (new Date()).getTime();
            let respdt = null;

            if (err)
            {
                return CallbackBridge(err);
            }

            if (xhr.statusCode !== 200)
            {
                return CallbackBridge('Status code ' + xhr.statusCode);
            }

            respdt = xhr.text;

            let body = null;
            if (opts.accept.toLowerCase() === 'json')
            {
                if (!xhr.text)
                {
                    return CallbackBridge('Response has not content.');
                }

                try
                {
                    respdt = body = JSON.parse(xhr.text);
                }
                catch (e)
                {
                    return CallbackBridge('Unable to resolve.');
                }

                if (conds && common.CheckStruct(body, conds))
                {
                    return CallbackBridge('Response failed.');
                }
            }
            else
            {
                respdt = body = xhr.text;
            }

            CallbackBridge(null, body);

            function CallbackBridge(finalError, dat)
            {
                logger[finalError ? 'error' : 'trace'](opts.log_category, JSON.stringify({
                    address: url,
                    params: params,
                    error: finalError || err,
                    code: xhr ? xhr.statusCode : null,
                    response: respdt,
                    msec: common.FloatSub(etsmp, stsmp)
                }));

                cb && cb(finalError, dat);
            }
        });
    }
};
