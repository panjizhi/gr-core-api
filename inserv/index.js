const moment = require('moment');
const common = require('../includes/common');
const utils = require('../includes/utils');
const async = require('../includes/workflow');
const { Check } = require('../includes/login');
const mongo = require('../drivers/mongodb');
const userDAL = require('../dal/user.dal');
const { PERMISSIONS } = require('../includes/decl');

module.exports = {
    time: (req, cb) =>
    {
        let mmt = moment(new Date());
        cb(0, {
            time: mmt.format('YYYY-MM-DD HH:mm:ss.SSS')
        });
    },
    Login: [
        utils.CheckObjectFields({
            username: 'string',
            password: 'string'
        }),
        (req, cb) =>
        {
            const { username, password } = req.body;
            async.auto({
                login: (cb) =>
                {
                    userDAL.Login(username, password, cb);
                },
                permissions: [
                    'login',
                    ({ login: { level } }, cb) =>
                    {
                        userDAL.GetPermissions(level, cb);
                    }
                ]
            }, (err, dat) =>
            {
                if (err)
                {
                    return cb(1);
                }

                const { login, permissions } = dat;
                login.permissions = permissions;

                req.session.login = login;

                cb(0);
            });
        }
    ],
    Logout: (req, cb) =>
    {
        delete req.session.login;
        cb(0);
    },
    GetCurrent: [
        Check(),
        (req, cb) =>
        {
            const login = req.session.login;
            cb(0, login);
        }
    ],
    ResetPassword: [
        utils.CheckObjectFields({
            original: 'string',
            password: 'string'
        }),
        Check(),
        (req, cb) =>
        {
            const { original, password } = req.body;
            const { id } = req.session.login;
            const _id = mongo.CreateObjectID(id);
            userDAL.ResetPassword(_id, original, password, utils.DefaultCallback(cb));
        }
    ],
    SaveAvatar: [
        utils.CheckObjectFields({ url: 'string' }),
        Check(),
        (req, cb) =>
        {
            const { url } = req.body;
            const { id } = req.session.login;
            const _id = mongo.CreateObjectID(id);
            userDAL.SaveAvatar(_id, url, (err) =>
            {
                if (err)
                {
                    return cb(1);
                }

                req.session.login.avatar = url;

                cb(0);
            });
        }
    ],
    GetUsers: [
        Check(),
        (req, cb) =>
        {
            const { level } = req.session.login;
            userDAL.GetUsers(level, utils.DefaultCallback(cb, 1));
        }
    ],
    SaveUser: [
        utils.CheckObjectFields({
            account: 'string',
            name: 'string',
            level: 'int'
        }),
        Check(),
        (req, cb) =>
        {
            const { account, name, level } = req.body;
            const { level: currentLevel } = req.session.login;
            if (level <= currentLevel)
            {
                return cb(1);
            }

            userDAL.SaveUser(account, name, level, utils.DefaultCallback(cb));
        }
    ],
    RemoveUser: [
        utils.CheckObjectFields({ id: 'string' }),
        Check(),
        mongo.ConvertInput({ id: 1 }),
        (req, cb) =>
        {
            const { id } = req.body;
            const { level } = req.session.login;
            userDAL.RemoveUser(id, level, utils.DefaultCallback(cb));
        }
    ],
    DirectResetPassword: [
        utils.CheckObjectFields({ id: 'string' }),
        Check(),
        mongo.ConvertInput({ id: 1 }),
        (req, cb) =>
        {
            const { id } = req.body;
            const { level } = req.session.login;
            userDAL.DirectResetPassword(id, level, utils.DefaultCallback(cb));
        }
    ],
    GetCurrentPermissions: [
        Check(),
        (req, cb) =>
        {
            const { level, permissions } = req.session.login;
            cb(null, {
                level,
                detail: permissions
            });
        }
    ],
    GetConfigurablePermissions: [
        Check(),
        (req, cb) =>
        {
            userDAL.GetConfigurablePermissions(utils.DefaultCallback(cb, 1));
        }
    ],
    SaveConfigurablePermissions: [
        Check(),
        utils.CheckServiceStruct({
            type: 'array',
            item: {
                type: 'object',
                fields: {
                    level: 'int',
                    value: {
                        type: 'object',
                        item: 'int'
                    }
                }
            }
        }),
        (req, cb) =>
        {
            const body = req.body;

            const value = body.map(ins =>
            {
                const ps = {};
                common.ObjectForEach(ins.value, (k, v) =>
                {
                    if (PERMISSIONS[k.toUpperCase()])
                    {
                        ps[k] = v;
                    }
                });

                return {
                    level: ins.level,
                    value: ps
                };
            });

            userDAL.SavePermissions(value, utils.DefaultCallback(cb));
        }
    ],
    SaveManagingContent: [
        Check(),
        utils.CheckObjectFields({
            user: 'string',
            classes: {
                type: 'array',
                item: 'string',
                null: 1
            },
            subjects: {
                type: 'array',
                item: 'string',
                null: 1
            }
        }),
        mongo.ConvertInput({
            user: 1,
            classes: 1,
            subjects: 1
        }),
        (req, cb) =>
        {
            const { user, classes, subjects } = req.body;
            const { level } = req.session.login;
            if (level >= 2)
            {
                return cb(1);
            }

            userDAL.SaveManagingContent(user, classes, subjects, utils.DefaultCallback(cb));
        }
    ]
};
