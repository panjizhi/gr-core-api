const express = require('express');
const bodyParser = require('body-parser');
const _ = require('underscore');
const settings = require('./settings');
const common = require('./includes/common');
const utils = require('./includes/utils');
const { PERMISSIONS } = require('./includes/decl');
const userDAL = require('./dal/user.dal');

const __permissionMap = {
    'questions': PERMISSIONS.QUESTIONS,
    'question-item': PERMISSIONS.QUESTIONS,
    'papers': PERMISSIONS.PAPERS,
    'paper-item': PERMISSIONS.PAPERS,
    'candidates': PERMISSIONS.CANDIDATES,
    'candidate-item': PERMISSIONS.CANDIDATES,
    'results': PERMISSIONS.RESULTS,
    'schedules': PERMISSIONS.SCHEDULES,
    'schedule': PERMISSIONS.NEW_SCHEDULE,
    'auto-schedules': PERMISSIONS.AUTO_SCHEDULE,
    'auto-schedule-item': PERMISSIONS.AUTO_SCHEDULE,
    'candidate-report': PERMISSIONS.CANDIDATE_REPORT,
    'class-report': PERMISSIONS.CLASS_REPORT,
    'import': PERMISSIONS.IMPORT,
    'users': PERMISSIONS.USERS,
    'permissions': PERMISSIONS.PERMISSIONS,
    'options': PERMISSIONS.OPTIONS
};

const __normalPages = [
    'setting'
];

const __pagesWeight = {
    'questions': 1,
    'papers': 2,
    'candidates': 3,
    'results': 4,
    'schedules': 5,
    'schedule': 6,
    'auto-schedules': 7,
    'candidate-report': 8,
    'class-report': 9,
    'import': 10,
    'users': 11,
    'permissions': 12,
    'options': 13
};

const __pagesMap = {};
common.ObjectForEach(__pagesWeight, (k, v) => __pagesMap[__permissionMap[k]] = k);

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

const routes = [
    'index'
];

const notFound = '404';
const fallback = 'login';
const index = GetIndexPage;
const direct = [];

const assets = utils.GetURLPrefix(settings.assets) + '/assets';
const js = assets + '/js';
const css = assets + '/css';
const img = assets + '/img';
const hrd = utils.GetURLPrefix(settings.console);

function GetIndexPage(req, cb)
{
    const { level } = req.session.login;
    userDAL.GetPermissions(level, (err, dat) =>
    {
        if (err)
        {
            return cb(notFound);
        }

        let page = null;
        let weight = 0;
        common.ObjectForEach(dat, (k, v) =>
        {
            if (!v)
            {
                return true;
            }

            const p = __pagesMap[k];
            const w = __pagesWeight[p];
            if (!weight || w < weight)
            {
                weight = w;
                page = p;
            }
        });

        cb(page || notFound);
    });
}

function CreatePath()
{
    const value = [];
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
    cb(req.session.login ? 0 : 1);
}

function CheckPrivilege(req, path, cb)
{
    if (__normalPages.indexOf(path) >= 0)
    {
        return cb();
    }

    const { level } = req.session.login;
    userDAL.GetPermissions(level, (err, dat) =>
    {
        if (err)
        {
            return cb(err);
        }

        if (!dat[__permissionMap[path]])
        {
            return cb(1);
        }

        cb();
    });
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
                        dat.img = img;
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
                            return Redirect(req, res, fallback);
                        }

                        CheckPrivilege(req, path, (err) =>
                        {
                            if (err)
                            {
                                return Redirect(req, res, index);
                            }

                            Render(req, res, next);
                        });
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

                        Redirect(req, res, index);
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
    CheckFallback(req, (err, value) =>
    {
        if (err || value)
        {
            return Redirect(req, res, fallback);
        }

        Redirect(req, res, index);
    });

});

Route(routes);

router.use((req, res) =>
{
    Redirect(req, res, notFound);
});

function Redirect(req, res, path)
{
    common.CompareType(path, 'function') ? path(req, (value) => Exec(value)) : Exec(path);

    function Exec(path)
    {
        res.redirect(hrd + '/' + path);
    }
}

module.exports = router;
