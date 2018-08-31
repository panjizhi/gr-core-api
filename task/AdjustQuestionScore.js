const { COLLS } = require('../includes/decl');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');
const paperDAL = require('../dal/paper.dal');

async.auto({
    questions: (cb) =>
    {
        mongodb.FindMany(COLLS.QUESTION, { qtype: 1 }, cb);
    },
    score: [
        'questions',
        ({ questions }, cb) =>
        {
            async.eachLimit(questions, 5, (ins, cb) =>
            {
                async.auto({
                    update: (cb) =>
                    {
                        mongodb.UpdateOne(COLLS.QUESTION, { _id: ins._id }, { score: ins.score * ins.content.count }, null, 0, cb);
                    },
                    paper: [
                        'update',
                        (dat, cb) =>
                        {
                            paperDAL.UpdateScoreByQuestion(ins._id, null, cb);
                        }
                    ]
                }, () => cb());
            }, cb);
        }
    ]
}, () =>
{
    process.exit();
});
