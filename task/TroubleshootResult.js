const { COLLS } = require('../includes/decl');
const common = require('../includes/common');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');
const paperDAL = require('../dal/paper.dal');

let count = 0;

async.auto({
    results: (cb) =>
    {
        mongodb.GetCollection(COLLS.RESULT, (err, coll, cb) =>
        {
            coll.find({}).toArray(cb);
        }, cb);
    },
    exec: [
        'results',
        ({ results }, cb) =>
        {
            async.eachLimit(results, 5, (ins, cb) =>
            {
                const { errJSON, paper } = ins;
                async.auto({
                    paper: (cb) =>
                    {
                        paperDAL.GetSingle(paper, cb);
                    },
                    exec: [
                        'paper',
                        ({ paper }, cb) =>
                        {
                            const errDict = {};
                            if (errJSON && errJSON.length)
                            {
                                const jerr = JSON.parse(errJSON);
                                jerr.forEach(ins => errDict[ins.id] = ins);
                            }

                            const answers = [];
                            paper.questions.forEach(ins =>
                            {
                                const err = errDict[ins._id.toHexString()];
                                answers.push({
                                    question: ins._id,
                                    answer: err ? (err.answer.charCodeAt() - 65) : ins.content.right,
                                    right: err ? 0 : 1
                                })
                            });

                            mongodb.UpdateOne(COLLS.RESULT, { _id: ins._id }, {
                                paper,
                                answers
                            }, null, 0, () =>
                            {
                                ++count;
                                console.log(count);
                                cb();
                            });
                        }
                    ]
                }, () => cb());
            }, cb);
        }
    ]
}, () =>
{
    console.log(`Completed ${count}`);
});
