const { COLLS } = require('../includes/decl');
const utils = require('../includes/utils');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');

module.exports = {
    Login: (username, password, cb) =>
    {
        async.auto({
            record: (cb) =>
            {
                mongodb.FindOne(COLLS.USER, {
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
            const text = utils.CreateSign(salt, password);
            if (text !== ciphertext)
            {
                return cb('Failed');
            }

            record.id = record._id.toHexString();

            delete record._id;
            delete record.salt;
            delete record.password;

            cb(null, record);
        });
    },
    ResetPassword: (_id, original, password, cb) =>
    {
        async.auto({
            record: (cb) =>
            {
                mongodb.FindOne(COLLS.USER, {
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
            const text = utils.CreateSign(salt, original);
            if (text !== ciphertext)
            {
                return cb('Failed');
            }

            const nsalt = utils.CreateRandomBytesBit();
            const nct = utils.CreateSign(nsalt, password);

            mongodb.UpdateOne(COLLS.USER, { _id }, {
                salt: nsalt,
                ciphertext: nct
            }, null, 0, cb);
        });
    }
};
