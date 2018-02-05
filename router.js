const express = require('express');
const bodyParser = require('body-parser');
const _ = require('underscore');
const settings = require('./settings');
const common = require('./includes/common');

const router = express.Router();

router.use(bodyParser.urlencoded({
    extended: true
}));

const routes = [
    'index'
];

const notFound = '404';
const fallback = 'login';
const index = 'questions';
const direct = [];

const cslStgs = settings.console;
const cdnStgs = settings.cdn;
const astStgs = cdnStgs.assets;

const assets = '//' + cdnStgs.host + cdnStgs.path + astStgs.path + '/assets';
const js = assets + '/js';
const css = assets + '/css';
const hrd = cslStgs.path;

function CreatePath()
{
    let value = [];
    for (let i = 0, l = arguments.length; i < l; ++i)
    {
        const instc = arguments[i];
        if (instc)
        {
            value.push(instc);
        }
    }

    return value.length ? value.join('/') : '';
}

function CheckFallback(req, cb)
{
    let login = req.session.login;
    cb(login ? 0 : 1);
}

function Route(routes, prefix)
{
    _.each(routes, (instc) =>
    {
        if (_.isString(instc))
        {
            const rtr = require(CreatePath('.', 'routes', prefix || '', instc));
            if (!rtr)
            {
                return true;
            }

            _.each(rtr, (func, name) =>
            {
                const path = CreatePath(prefix, name);

                function Render(req, res, next)
                {
                    func(req, (err, dat) =>
                    {
                        if (err)
                        {
                            return next();
                        }

                        if (!dat)
                        {
                            dat = {};
                        }
                        dat.assets = assets;
                        dat.js = js;
                        dat.css = css;
                        dat.hrd = hrd;

                        res.render(path, dat);
                    });
                }

                function Check(req, res, next)
                {
                    CheckFallback(req, (err, value) =>
                    {
                        if (err || value)
                        {
                            return Redirect(res, common.SetURIParams(fallback, {
                                rd: encodeURIComponent(req.url)
                            }));
                        }

                        Render(req, res, next);
                    });
                }

                function Skip(req, res, next)
                {
                    CheckFallback(req, (err, value) =>
                    {
                        if (err || value)
                        {
                            return Render(req, res, next);
                        }

                        Redirect(res, index);
                    });
                }

                let rcb = null;
                if (path === notFound)
                {
                    rcb = Render;
                }
                else if (path === fallback)
                {
                    rcb = Skip;
                }
                else if (direct.indexOf(path) < 0)
                {
                    rcb = Check;
                }
                else
                {
                    rcb = Render;
                }

                router.get('/' + path, rcb);
            });
        }
        else if (_.isObject(instc))
        {
            _.each(instc, (child, dir) =>
            {
                const pfx = CreatePath(prefix, dir);
                Route(child, pfx);
            });
        }
    });
}

router.get('/', (req, res) =>
{
    Redirect(res, index);
});

Route(routes);

router.use(function (req, res)
{
    Redirect(res, notFound);
});

function Redirect(res, path)
{
    res.redirect('/' + CreatePath(cslStgs.path, path));
}

module.exports = router;
