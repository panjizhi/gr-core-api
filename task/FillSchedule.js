const { COLLS } = require('../includes/decl');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');

async.auto({
    papers: (cb) =>
    {
        mongodb.GetCollection(COLLS.PAPER, (err, coll, cb) =>
        {
            coll.find({}).toArray(cb);
        }, cb);
    },
    candidates: (cb) =>
    {
        mongodb.GetCollection(COLLS.CANDIDATE, (err, coll, cb) =>
        {
            coll.find({}).toArray(cb);
        }, cb);
    }
}, (err, dat) =>
{
    if (err)
    {
        console.log(err);
        return;
    }

    const { papers, candidates } = dat;
    async.auto({
        papser: (cb) =>
        {
            async.eachLimit(papers, 10, (ins, cb) =>
            {
                mongodb.GetCollection(COLLS.SCHEDULE, (err, coll, cb) =>
                {
                    coll.updateMany({
                        paper: ins._id
                    }, {
                        $set: {
                            paper_name: ins.name
                        }
                    }, cb);
                }, cb);
            }, cb);
        },
        candidate: (cb) =>
        {
            async.eachLimit(candidates, 10, (ins, cb) =>
            {
                mongodb.GetCollection(COLLS.SCHEDULE, (err, coll, cb) =>
                {
                    coll.updateMany({
                        student: ins._id
                    }, {
                        $set: {
                            candidate_name: ins.name
                        }
                    }, cb);
                }, cb);
            }, cb);
        }
    }, () =>
    {
        console.log('Completed');
    })
});
