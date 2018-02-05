const moment = require('moment');
const common = require('../includes/common');
const utils = require('../includes/utils');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');
const question = require('../dal/question.dal');
const candidate = require('../dal/candidate.dal');
const paper = require('../dal/paper.dal');
const schedule = require('../dal/schedule.dal');
const result = require('../dal/result.dal');

module.exports = {
    list: [
        utils.CheckObjectFields({ openid: 'string' }),
        (req, cb) =>
        {
            const { openid } = req.body;
            async.auto({
                candidate: (cb) =>
                {
                    candidate.GetSingleByOPENID(openid, (err, dat) =>
                    {
                        if (err)
                        {
                            return cb(err);
                        }

                        if (!dat)
                        {
                            return cb('Not found.');
                        }

                        cb(null, dat);
                    });
                },
                schedules: [
                    'candidate',
                    ({ candidate }, cb) =>
                    {
                        schedule.GetUndone(candidate._id, cb);
                    }
                ]
            }, (err, dat) =>
            {
                if (err || !dat.candidate)
                {
                    return cb(null, []);
                }

                const { schedules } = dat;
                schedules.forEach(ins => ins.paper = {
                    _id: ins.paper,
                    name: ins.paper_name
                });

                cb(null, schedules);
            });
        }
    ],
    detail: [
        utils.CheckObjectFields({ id: 'string' }),
        mongodb.CheckObjectID('id'),
        (req, cb) =>
        {
            const { _id } = req.body;
            paper.GetSingle(_id, (err, dat) =>
            {
                if (err)
                {
                    return cb(err);
                }

                dat.now = moment().unix();

                cb(null, dat);
            });
        }
    ],
    calculate: [
        utils.CheckObjectFields({
            start_time: 'uint',
            examId: 'string',
            answers: 'object',
            dispatchId: 'string',
            userId: 'string'
        }),
        mongodb.CheckObjectID('examId', 'dispatchId', 'userId'),
        (req, cb) =>
        {
            const { start_time, _examId, _dispatchId, _userId, answers } = req.body;
            const ntsmp = moment().unix();

            async.auto({
                paper: (cb) =>
                {
                    paper.GetSingle(_examId, cb);
                }
            }, (err, dat) =>
            {
                if (err)
                {
                    return cb(1, err);
                }

                const { paper } = dat;

                let score = 0;
                const ansArr = [];

                const qusDict = {};
                paper.questions.forEach((ins) => qusDict[ins._id.toHexString()] = ins);

                Object.keys(answers).forEach(ins =>
                {
                    const val = answers[ins];
                    const qus = qusDict[ins];
                    if (!qus)
                    {
                        return true;
                    }

                    const { qtype, content } = qus;

                    const func = [
                        () => val === content.right,
                        () =>
                        {
                            if (!common.CompareType(val, 'array'))
                            {
                                return false;
                            }

                            const count = content.count;
                            if (val.length < count || content.answers.length < count)
                            {
                                return false;
                            }

                            for (let i = 0, l = count; i < l; ++i)
                            {
                                const rg = content.answers[i];
                                const ans = val[i];
                                if (ans !== rg)
                                {
                                    return false;
                                }
                            }

                            return true;
                        }
                    ][qtype];
                    if (!func)
                    {
                        return true;
                    }

                    const right = func();
                    if (right)
                    {
                        score += qus.score;
                    }

                    ansArr.push({
                        question: qus._id,
                        answer: val,
                        right: right ? 1 : 0
                    });
                });

                const duration = ntsmp - start_time;
                async.auto({
                    result: (cb) =>
                    {
                        result.SaveSingle({
                            author: _userId,
                            paper: paper,
                            schedule: _dispatchId,
                            score,
                            begin_time: start_time,
                            end_time: ntsmp,
                            duration,
                            answers: ansArr,
                            created_time: ntsmp,
                            updated_time: ntsmp
                        }, cb);
                    },
                    schedule: [
                        'result',
                        ({ result }, cb) =>
                        {
                            schedule.UpdateSingle(_dispatchId, start_time, ntsmp, duration, score, result, cb);
                        }
                    ],
                    questions: (cb) =>
                    {
                        async.eachLimit(ansArr, 10, (ins, cb) =>
                        {
                            question.UpdateSingle(ins.question, ins.right ? 0 : 1, ntsmp, cb);
                        }, cb);
                    }
                }, (err) =>
                {
                    if (err)
                    {
                        return cb(1, err);
                    }

                    cb(0, { score });
                });
            });
        }
    ],
    accomplish: [
        utils.CheckObjectFields({ openid: 'string' }),
        (req, cb) =>
        {
            const { openid } = req.body;
            async.auto({
                candidate: (cb) =>
                {
                    candidate.GetSingleByOPENID(openid, cb);
                }
            }, (err, dat) =>
            {
                if (err)
                {
                    return cb(1, err);
                }

                const { candidate } = dat;
                result.GetCandidateItems(candidate._id, utils.DefaultCallback(cb, 1));
            });
        }
    ],
    review: [
        utils.CheckObjectFields({ id: 'string' }),
        mongodb.CheckObjectID('id'),
        (req, cb) =>
        {
            const { _id } = req.body;
            result.GetSingle(_id, utils.DefaultCallback(cb, 1));
        }
    ]
};
