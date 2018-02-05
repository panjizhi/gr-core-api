const { COLLS } = require('../includes/decl');
const common = require('../includes/common');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');
const question = require('../dal/question.dal');

async.auto({
    questions: (cb) =>
    {
        mongodb.GetCollection(COLLS.QUESTION, (err, coll, cb) =>
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

    let count = 0;

    const { questions } = dat;
    async.eachLimit(questions, 10, (ins, cb) =>
    {
        if (!common.IsUndefined(ins.qtype))
        {
            return cb();
        }

        try
        {
            question.Troubleshoot(ins);
        }
        catch (ex)
        {
            console.log(ins._id);
            return cb();
        }

        mongodb.UpdateOne(COLLS.QUESTION, { _id: ins._id }, ins, null, 0, () =>
        {
            ++count;
            cb();
        });
    }, () =>
    {
        console.log(`Completed ${count}`);
    })
});
