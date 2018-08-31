const moment = require('moment');
const { COLLS, PERMISSIONS } = require('../includes/decl');
const common = require('../includes/common');
const utils = require('../includes/utils');
const async = require('../includes/workflow');
const mongo = require('../drivers/mongodb');

function CleanSystemPermissions(dict)
{
    delete dict[PERMISSIONS.PERMISSIONS];
    delete dict[PERMISSIONS.OPTIONS];
}

module.exports = {
    Login: (username, password, cb) =>
    {
        async.auto({
            record: (cb) =>
            {
                mongo.FindOne(COLLS.USER, {
                    $or: [
                        {
                            login: username
                        },
                        {
                            email: username
                        },
                        {
                            phone: username
                        }
                    ]
                }, cb);
            }
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            const { record, record: { salt, ciphertext } } = dat;
            const text = utils.CreateSign(password, salt);
            if (text !== ciphertext)
            {
                return cb('Failed');
            }

            record.id = record._id.toHexString();

            delete record._id;
            delete record.salt;
            delete record.password;
            delete record.ciphertext;

            cb(null, record);
        });
    },
    ResetPassword: (_id, original, password, cb) =>
    {
        async.auto({
            record: (cb) =>
            {
                mongo.FindOne(COLLS.USER, {
                    _id: _id
                }, cb);
            }
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            const { record: { salt, ciphertext } } = dat;
            const text = utils.CreateSign(original, salt);
            if (text !== ciphertext)
            {
                return cb('Failed');
            }

            const nsalt = utils.CreateRandomBytesBit();
            const nct = utils.CreateSign(password, nsalt);

            mongo.UpdateOne(COLLS.USER, { _id }, {
                salt: nsalt,
                ciphertext: nct
            }, null, 0, cb);
        });
    },
    SaveAvatar: (_id, url, cb) =>
    {
        const ntsmp = moment().unix();
        mongo.UpdateOne(COLLS.USER, { _id }, {
            avatar: url,
            updated_time: ntsmp
        }, null, 0, cb);
    },
    GetUsers: (level, cb) =>
    {
        mongo.FindMany(COLLS.USER, {
            level: { $gt: level }
        }, {
            projection: {
                _id: 1,
                login: 1,
                name: 1,
                avatar: 1,
                level: 1,
                classes: 1,
                subjects: 1
            }
        }, cb);
    },
    SaveUser: (account, name, level, cb) =>
    {
        async.auto({
            check: (cb) =>
            {
                mongo.FindMany(COLLS.USER, { login: account }, cb);
            },
            exec: [
                'check',
                ({ check }, cb) =>
                {
                    if (check.length)
                    {
                        return cb('Account existent.');
                    }

                    const ntsmp = moment().unix();
                    const salt = utils.CreateRandomBytesBit();
                    const ciphertext = utils.CreateSign('00000000', salt);

                    mongo.InsertOne(COLLS.USER, {
                        login: account,
                        name,
                        level,
                        salt,
                        ciphertext,
                        created_time: ntsmp,
                        updated_time: ntsmp
                    }, cb);
                }
            ]
        }, cb);
    },
    RemoveUser: (_id, level, cb) =>
    {
        mongo.Remove(COLLS.USER, {
            _id,
            level: { $gt: level }
        }, cb);
    },
    DirectResetPassword: (_id, level, cb) =>
    {
        const ntsmp = moment().unix();
        const salt = utils.CreateRandomBytesBit();
        const cipher = utils.CreateSign('00000000', salt);
        mongo.UpdateOne(COLLS.USER, {
            _id,
            level: { $gt: level }
        }, {
            salt,
            ciphertext: cipher,
            updated_time: ntsmp
        }, null, 0, cb);
    },
    GetConfigurablePermissions: (cb) =>
    {
        mongo.FindMany(COLLS.PERMISSIONS, null, cb);
    },
    GetPermissions: (level, cb) =>
    {
        if (level === 0)
        {
            const detail = {};
            detail[PERMISSIONS.USERS] = 1;
            detail[PERMISSIONS.PERMISSIONS] = 1;
            detail[PERMISSIONS.OPTIONS] = 1;

            return cb(null, detail);
        }

        if (level === 1)
        {
            const detail = {};
            common.ObjectForEach(PERMISSIONS, (k, ins) => detail[ins] = 1);

            CleanSystemPermissions(detail);

            return cb(null, detail);
        }

        mongo.FindMany(COLLS.PERMISSIONS, { level }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            if (!dat.length)
            {
                return cb(null, {});
            }

            cb(null, dat[0].value);
        });
    },
    SavePermissions: (value, cb) =>
    {
        value.forEach(ins => CleanSystemPermissions(ins.value));

        async.eachLimit(value, 10, ({ level, value }, cb) =>
        {
            mongo.UpdateOne(COLLS.PERMISSIONS, { level }, { value }, null, 1, cb);
        }, cb);
    },
    SaveManagingContent: (_id, classes, subjects, cb) =>
    {
        const set = {};
        let setCount = 0;
        const unset = {};
        let unsetCount = 0;

        if (classes)
        {
            set.classes = classes;
            ++setCount;
        }
        else
        {
            unset.classes = classes;
            ++unsetCount;
        }
        if (subjects)
        {
            set.subjects = subjects;
            ++setCount;
        }
        else
        {
            unset.subjects = subjects;
            ++unsetCount;
        }
        mongo.UpdateOne(COLLS.USER, { _id }, setCount ? set : null, unsetCount ? unset : null, 0, cb);
    }
};
