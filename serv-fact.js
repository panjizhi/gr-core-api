const express = require('express');
const bodyParser = require('body-parser');
const _ = require('underscore');
const moment = require('moment');
const common = require('./includes/common');
const utils = require('./includes/utils');
const logFact = require('./includes/log');

const __defaultRouteOption = {
    record: 0
};

module.exports = (dir, routes, options, before) =>
{
    !options && (options = {});
    options = common.Extend(options, __defaultRouteOption, 1);

    const router = express.Router();

    router.use((req, res, next) =>
    {
        res.set('Connection', 'close');
        next();
    });

    before && before(router);

    const parser = bodyParser.json({
        limit: '512kb',
        type: () => 1
    });

    router.use((req, res, next) =>
    {
        parser(req, res, (err) =>
        {
            if (err)
            {
                return res.status(400).end();
            }

            next();
        });
    });

    routes.forEach(unit =>
    {
        let insUnit = common.CompareType(unit, 'string') ? { name: unit } : unit;
        insUnit = common.Extend(insUnit, options, 1);

        const logger = insUnit.record ? logFact.Create('RequestRecord-' + dir + '-' + insUnit.name) : null;

        const mod = require('./' + dir + '/' + insUnit.name);
        _.each(mod, (func, name) =>
        {
            let funcArr = common.CompareType(func, 'array') ? func : [func];
            router.all('/' + insUnit.name + '/' + name, CallQueue);

            function CallQueue(req, res)
            {
                req.internal_env = {
                    platform: dir,
                    category: insUnit.name,
                    function: name
                };

                let bmsecs = moment().valueOf();

                utils.CallRequestIterate(req, funcArr, (hstat, dat, msg) =>
                {
                    if (hstat && !msg && dat)
                    {
                        msg = dat;
                        dat = undefined;
                    }

                    dat === null && (dat = undefined);
                    msg === null && (msg = undefined);

                    let bdat = {
                        status: hstat ? (common.CompareType(hstat, 'number') ? hstat : 1) : 0,
                        data: dat,
                        msg: msg
                    };

                    let emsecs = moment().valueOf();

                    logger && logger.trace(name, JSON.stringify({
                        headers: req.headers,
                        params: req.body,
                        response: bdat,
                        msecs: common.FloatSub(emsecs, bmsecs)
                    }));

                    res.status(200).json(bdat);
                });
            }
        });
    });

    router.use(utils.Return404());

    return router;
};
