const express = require('express');
const bodyParser = require('body-parser');
const _ = require('underscore');
const moment = require('moment');
const common = require('./includes/common');
const utils = require('./includes/utils');
const logFact = require('./includes/log');

const router = express.Router();

const routes = [
    'user',
    'exam'
];

router.use((req, res, next) =>
{
    res.apiResponse = (data) =>
    {
        if (req.query.callback)
        {
            res.jsonp(data);
        }
        else
        {
            res.json(data);
        }
    };

    res.apiError = (key, err, msg, code) =>
    {
        msg = msg || 'Error';
        key = key || 'unknown error';
        msg += ' (' + key + ')';
        res.status(code || 500);
        res.apiResponse({ error: key || 'error', detail: err });
    };

    res.apiNotFound = (err, msg) =>
    {
        res.apiError('data not found', err, msg || 'not found', 404);
    };

    res.apiNotAllowed = (err, msg) =>
    {
        res.apiError('access not allowed', err, msg || 'not allowed', 403);
    };

    next();
});

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

routes.forEach(ins =>
{
    const logger = logFact.Create(`RequestRecord-api-${ins}`);

    const mod = require(`./api/${ins}`);
    _.each(mod, (func, name) =>
    {
        let funcArr = common.CompareType(func, 'array') ? func : [func];
        router.all(`/${ins}/${name}`, (req, res) =>
        {
            let bmsecs = moment().valueOf();

            utils.CallRequestIterate(req, funcArr, (status, dat) =>
            {
                let emsecs = moment().valueOf();

                logger.trace(name, JSON.stringify({
                    params: req.body,
                    status: status,
                    response: dat,
                    msecs: common.FloatSub(emsecs, bmsecs)
                }));

                status ? res.status(500).end() : res.status(200).json(dat);
            });
        });
    });
});

router.use(utils.Return404());

module.exports = router;
