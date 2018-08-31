const moment = require('moment');
const { COLLS } = require('../includes/decl');
const mongo = require('../drivers/mongodb');

module.exports = {
    GetOptions: (key, cb) =>
    {
        mongo.FindMany(COLLS.OPTIONS, { key }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            if (!dat.length)
            {
                return cb();
            }

            cb(null, dat[0].value);
        });
    },
    SaveOptions: (key, value, cb) =>
    {
        const ntsmp = moment().unix();
        mongo.UpdateOne(COLLS.OPTIONS, { key }, {
            value,
            updated_time: ntsmp
        }, null, 1, cb);
    }
};
