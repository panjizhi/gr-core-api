const crypto = require('crypto');
const common = require('../includes/common');

module.exports = {
    CreateRedisKey: (...fields) =>
    {
        return fields.join(':');
    },
    CreateNormalID: () =>
    {
        return module.exports.CreateRandomBytesBit(8);
    },
    CreateSign: (content, salt) =>
    {
        return crypto.createHash('sha256').update(salt + content).digest().toString('hex');
    },
    CreateRandomBytesBit: (num) =>
    {
        if (!num)
        {
            num = 32;
        }
        return crypto.randomBytes(num).toString('hex');
    },
    GetURLPrefix: (stgsNode) =>
    {
        const p = '//' + stgsNode.host + (stgsNode.path || '');
        return stgsNode.protocol ? (stgsNode.protocol + ':' + p) : p;
    },
    CheckObjectFields: (struct, get) =>
    {
        return (req, cb) =>
        {
            if (get)
            {
                req.body = req.query;
            }

            let params = req.body;

            let lnks = [];
            if (common.CheckStruct(params, {
                type: 'object',
                fields: struct
            }, lnks))
            {
                return cb(-2, null, lnks.join('->'));
            }

            cb(0);
        };
    },
    CheckServiceStruct: (struct) =>
    {
        return (req, cb) =>
        {
            let params = req.body;

            let lnks = [];
            if (common.CheckStruct(params, struct, lnks))
            {
                return cb(-2, null, lnks.join('->'));
            }

            cb(0);
        };
    },
    CallRequestIterate: (req, funcArr, cb) =>
    {
        let i = 0;
        let l = funcArr.length;

        Iterate();

        function Iterate()
        {
            CallInstance(funcArr[i], req, (hstat, ...params) =>
            {
                if (hstat || (++i) >= l)
                {
                    return cb(hstat, ...params);
                }

                setImmediate(Iterate);
            });
        }

        function CallInstance(func, req, cb)
        {
            let called = 0;
            func(req, (...params) =>
            {
                if (called || !(called = 1))
                {
                    return;
                }

                cb(...params);
            });
        }
    },
    DefaultCallback: (cb, hasData) =>
    {
        return (err, dat) =>
        {
            if (err)
            {
                return cb(1);
            }

            cb(0, hasData ? dat : undefined);
        };
    },
    Return404: () => (req, res) => res.status(404).end()
};
