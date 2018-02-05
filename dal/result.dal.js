const { COLLS } = require('../includes/decl');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');
const questionDAL = require('../dal/question.dal');

module.exports = {
    GetMany: (_pid, paperName, _cid, candidateName, start, count, cb) =>
    {
        async.auto({
            _papers: (cb) =>
            {
                if (_pid)
                {
                    return cb(null, [_pid]);
                }

                if (!paperName)
                {
                    return cb();
                }

                mongodb.GetCollection(COLLS.PAPER, (err, coll, cb) =>
                {
                    coll.find({
                        name: {
                            $regex: paperName,
                            $options: 'i'
                        }
                    }, {
                        projection: {
                            _id: 1
                        }
                    }).toArray((err, dat) =>
                    {
                        if (err)
                        {
                            return cb(err);
                        }

                        cb(null, dat.map(ins => ins._id));
                    });
                }, cb);
            },
            _candidates: (cb) =>
            {
                if (_cid)
                {
                    return cb(null, [_cid]);
                }

                if (!candidateName)
                {
                    return cb();
                }

                mongodb.GetCollection(COLLS.CANDIDATE, (err, coll, cb) =>
                {
                    coll.find({
                        name: {
                            $regex: candidateName,
                            $options: 'i'
                        }
                    }, {
                        projection: {
                            _id: 1
                        }
                    }).toArray((err, dat) =>
                    {
                        if (err)
                        {
                            return cb(err);
                        }

                        cb(null, dat.map(ins => ins._id));
                    });
                }, cb);
            }
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            const { _papers, _candidates } = dat;

            async.auto({
                results: (cb) =>
                {
                    let incr = 0;
                    const filter = [];
                    if (_papers)
                    {
                        ++incr;
                        filter.push({
                            'paper._id': {
                                $in: _papers
                            }
                        });
                    }
                    if (_candidates)
                    {
                        ++incr;
                        filter.push({
                            author: {
                                $in: _candidates
                            }
                        });
                    }

                    const exp = {};
                    if (incr)
                    {
                        exp[`$${!!_pid || !!_cid ? 'and' : 'or'}`] = filter;
                    }
                    mongodb.CallPagingModel(COLLS.RESULT, exp, {
                        updated_time: -1
                    }, start, count, cb);
                },
                candidates: [
                    'results',
                    ({ results }, cb) =>
                    {
                        if (!results.total)
                        {
                            return cb();
                        }

                        const _cids = results.records.map(ins => ins.author);
                        mongodb.GetCollection(COLLS.CANDIDATE, (err, coll, cb) =>
                        {
                            coll.find({
                                _id: {
                                    $in: _cids
                                }
                            }, {
                                projection: {
                                    _id: 1,
                                    name: 1,
                                    avatarUrl: 1
                                }
                            }).toArray(cb);
                        }, cb);
                    }
                ]
            }, (err, dat) =>
            {
                if (err)
                {
                    return cb(err);
                }

                const { results, candidates } = dat;

                if (!results.total)
                {
                    return cb(null, results);
                }

                function CreateDict(arr)
                {
                    const dict = {};
                    arr.forEach(ins => dict[ins._id.toHexString()] = ins);
                    return dict;
                }

                const cdict = CreateDict(candidates);

                results.records.forEach(ins =>
                {
                    ins.candidate = ins.author;
                    const cins = cdict[ins.candidate.toHexString()];
                    if (cins)
                    {
                        ins.candidate = cins;
                    }
                });

                cb(null, results);
            });
        });
    },
    GetCandidateItems: (_cid, cb) =>
    {
        mongodb.GetCollection(COLLS.RESULT, (err, coll, cb) =>
        {
            coll.find({ author: _cid }, {
                sort: { created_time: -1 },
                projection: {
                    _id: 1,
                    'paper.name': 1,
                    'paper.score': 1,
                    score: 1,
                    begin_time: 1,
                    duration: 1,
                    created_time: 1
                }
            }).toArray(cb);
        }, cb);
    },
    GetSingle: (_id, cb) =>
    {
        mongodb.FindOne(COLLS.RESULT, { _id }, null, cb);
    },
    SaveSingle: (doc, cb) =>
    {
        mongodb.InsertOne(COLLS.RESULT, doc, cb);
    },
    GetWrongQuestions: (_cid, cb) =>
    {
        async.auto({
            categories: (cb) =>
            {
                questionDAL.GetCategories(cb);
            },
            results: (cb) =>
            {
                mongodb.GetCollection(COLLS.RESULT, (err, coll, cb) =>
                {
                    coll.find({
                        author: _cid,
                        'answers.right': 0
                    }, {
                        sort: { created_time: -1 }
                    }).toArray(cb);
                }, cb);
            },
            exec: [
                'categories',
                'results',
                ({ categories, results }, cb) =>
                {
                    const catDict = {};
                    categories.forEach(ins => catDict[ins._id.toHexString()] = ins);

                    const qusArr = [];
                    results.forEach(ins =>
                    {
                        const time = ins.created_time;

                        const qusDict = {};
                        ins.paper.questions.forEach(ins => qusDict[ins._id.toHexString()] = ins);

                        ins.answers.forEach(ins =>
                        {
                            if (ins.right)
                            {
                                return true;
                            }

                            const qus = qusDict[ins.question.toHexString()];
                            if (qus.subject)
                            {
                                qus.subject = catDict[qus.subject.toHexString()];
                            }
                            if (qus.knowledges && qus.knowledges.length)
                            {
                                qus.knowledges = qus.knowledges.map(ins => catDict[ins.toHexString()]);
                            }

                            ins.question = qus;
                            ins.time = time;

                            qusArr.push(ins);
                        });
                    });

                    cb(null, qusArr);
                }
            ]
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            cb(null, dat.exec);
        });
    }
};
