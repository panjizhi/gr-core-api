const { COLLS } = require('../includes/decl');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');

async.auto({
    grade: (cb) =>
    {
        mongodb.UpdateMany(COLLS.CANDIDATE, null, {
            $unset: { grade: 1 }
        }, cb);
    },
    class: [
        'grade',
        (dat, cb) =>
        {
            mongodb.FindMany(COLLS.CANDIDATE, {
                class: { $ne: null }
            }, cb);
        }
    ],
    update: [
        'class',
        (dat, cb) =>
        {
            async.eachLimit(dat.class, 10, (ins, cb) => mongodb.UpdateOne(COLLS.CANDIDATE, { _id: ins._id }, {
                classes: [ins.class]
            }, { class: 1 }, 0, cb), cb);
        }
    ]
}, () =>
{
    process.exit();
});
