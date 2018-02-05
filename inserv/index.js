const moment = require('moment');
const utils = require('../includes/utils');
const { Check } = require('../includes/login');
const mongodb = require('../drivers/mongodb');
const user = require('../dal/user.dal');

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
            user.Login(username, password, (err, dat) =>
            {
                if (err)
                {
                    return cb(1);
                }

                req.session.login = dat;

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
            const _id = mongodb.CreateObjectID(id);
            user.ResetPassword(_id, original, password, utils.DefaultCallback(cb));
        }
    ]
};
