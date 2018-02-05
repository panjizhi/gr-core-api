const common = require('../includes/common');
const utils = require('../includes/utils');
const async = require('../includes/workflow');
const weixin = require('../dal/weixin.dal');
const candidate = require('../dal/candidate.dal');

module.exports = {
    session: [
        utils.CheckObjectFields({ code: 'string' }),
        (req, cb) =>
        {
            const { code } = req.body;
            async.auto({
                code: (cb) =>
                {
                    weixin.Authenticate(code, cb);
                },
                candidate: [
                    'code',
                    ({ code }, cb) =>
                    {
                        candidate.GetSingleByOPENID(code.openid, cb);
                    }
                ]
            }, (err, dat) =>
            {
                if (err)
                {
                    return cb(1, err);
                }

                const { code, candidate } = dat;
                const rlt = common.Extend(code, candidate, 1);

                cb(0, rlt);
            });
        }
    ],
    add: [
        utils.CheckObjectFields({
            openid: 'string',
            name: 'string',
            avatar: 'string'
        }),
        (req, cb) =>
        {
            const { openid, name, avatar } = req.body;
            candidate.CreateSingle(openid, name, avatar, (err, dat) =>
            {
                if (err)
                {
                    return cb(1, err);
                }

                cb(0, {
                    _id: dat,
                    name: name
                });
            });
        }
    ]
};
