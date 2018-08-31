const { COLLS } = require('../includes/decl');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');
const paperDAL = require('../dal/paper.dal');

let count = 0;

async.auto({
    papers: (cb) =>
    {
        mongodb.FindMany(COLLS.PAPER, {}, {
            projection: { _id: 1 }
        }, cb);
    },
    exec: [
        'papers',
        ({ papers }, cb) =>
        {
            async.eachLimit(papers, 10, (ins, cb) => paperDAL.UpdateScore(ins._id, (err) =>
            {
                err && console.log(err);
                ++count;
                cb();
            }), cb);
        }
    ]
}, () =>
{
    console.log(`Completed ${count}`);
});
