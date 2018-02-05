const { COLLS } = require('../includes/decl');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');

let count = 0;

async.auto({
    papers: (cb) =>
    {
        mongodb.GetCollection(COLLS.PAPER, (err, coll, cb) =>
        {
            coll.find({ score: null }).toArray(cb);
        }, cb);
    },
    exec: [
        'papers',
        ({ papers }, cb) =>
        {
            async.eachLimit(papers, 10, (ins, cb) =>
            {
                async.auto({
                    score: (cb) =>
                    {
                        mongodb.GetCollection(COLLS.QUESTION, (err, coll, cb) =>
                        {
                            coll.aggregate([
                                {
                                    $match: {
                                        _id: {
                                            $in: ins.questions
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: 'sum',
                                        score: { $sum: '$score' }
                                    }
                                }
                            ]).toArray((err, dat) =>
                            {
                                if (err)
                                {
                                    return cb(err);
                                }

                                if (!dat.length)
                                {
                                    return cb('Not found.');
                                }

                                const { score } = dat[0];
                                cb(null, score);
                            });
                        }, cb);
                    },
                    exec: [
                        'score',
                        ({ score }, cb) =>
                        {
                            mongodb.UpdateOne(COLLS.PAPER, { _id: ins._id }, { score }, null, 0, () =>
                            {
                                ++count;
                                console.log(count);
                                cb();
                            });
                        }
                    ]
                }, cb);
            }, cb);
        }
    ]
}, () =>
{
    console.log(`Completed ${count}`);
});
