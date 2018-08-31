const { COLLS } = require('../includes/decl');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');

let count = 0;

async.auto({
    papers: (cb) =>
    {
        mongodb.FindMany(COLLS.PAPER, {
            disorder: 1,
            $or: [
                { duration: 0 },
                {
                    duration: { $exists: false }
                }
            ]
        }, {
            projection: {
                _id: 1,
                questions: 1
            }
        }, cb);
    },
    exec: [
        'papers',
        ({ papers }, cb) =>
        {
            async.eachLimit(papers, 10, ({ _id, questions }, cb) =>
            {
                ++count;

                const duration = Math.ceil(questions.length * 2.2);
                mongodb.UpdateOne(COLLS.PAPER, { _id }, { duration }, null, 0, cb);
            }, cb);
        }
    ]
}, () =>
{
    console.log(`Completed ${count}`);

    process.exit();
});
