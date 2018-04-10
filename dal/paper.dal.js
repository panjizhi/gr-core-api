const moment = require('moment');
const { COLLS } = require('../includes/decl');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');
const category = require('../dal/category.dal');
const notification = require('../dal/notification');

module.exports = {
    GetCategories: (cb) =>
    {
        mongodb.GetCollection(COLLS.PAPER_CATEGORY, (err, coll, cb) =>
        {
            coll.find({}, {
                sort: {
                    updated_time: 1
                }
            }).toArray(cb);
        }, cb);
    },
    AddCategory: (name, _pid, cb) =>
    {
        category.Add(COLLS.PAPER_CATEGORY, name, _pid, cb);
    },
    RemoveCategory: (_id, cb) =>
    {
        async.auto({
            _ids: (cb) =>
            {
                mongodb.GetCollection(COLLS.PAPER_CATEGORY, (err, coll, cb) =>
                {
                    category.LoopIDs(coll, _id, cb);
                }, cb);
            },
            candidates: [
                '_ids',
                ({ _ids }, cb) =>
                {
                    mongodb.GetCollection(COLLS.PAPER, (err, coll, cb) =>
                    {
                        coll.updateMany({
                            category: {
                                $in: _ids
                            }
                        }, {
                            $set: {
                                category: null
                            }
                        }, cb);
                    }, cb);
                }
            ]
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            const { _ids } = dat;
            category.Remove(COLLS.PAPER_CATEGORY, _ids, cb);
        });
    },
    GetMany: (name, _cid, _qid, start, count, cb) =>
    {
        async.auto({
            categories: (cb) =>
            {
                if (!_cid)
                {
                    return cb();
                }

                mongodb.GetCollection(COLLS.PAPER_CATEGORY, (err, coll, cb) =>
                {
                    category.LoopIDs(coll, _cid, cb);
                }, cb);
            }
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            const { categories } = dat;

            const filter = {};
            if (name)
            {
                filter.name = {
                    $regex: name,
                    $options: 'i'
                };
            }
            if (categories)
            {
                filter.category = { $in: categories };
            }
            if (_qid)
            {
                filter.questions = _qid;
            }
            mongodb.CallPagingModel(COLLS.PAPER, filter, {
                updated_time: -1
            }, start, count, cb);
        });
    },
    GetSingle: (_id, cb) =>
    {
        async.auto({
            paper: (cb) =>
            {
                mongodb.FindOne(COLLS.PAPER, { _id }, cb);
            },
            questions: [
                'paper',
                ({ paper }, cb) =>
                {
                    if (!paper.questions || !paper.questions.length)
                    {
                        return cb();
                    }

                    mongodb.GetCollection(COLLS.QUESTION, (err, coll, cb) =>
                    {
                        coll.find({
                            _id: {
                                $in: paper.questions
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

            const { paper, questions } = dat;
            if (!questions || !questions.length)
            {
                paper.questions = null;
                return cb(null, paper);
            }

            const qdict = {};
            questions.forEach(ins => qdict[ins._id.toHexString()] = ins);

            const qarr = [];
            paper.questions.forEach(ins =>
            {
                const id = ins.toHexString();
                id in qdict && qarr.push(qdict[id]);
            });

            paper.questions = qarr;

            cb(null, paper);
        });
    },
    SaveSingle: (doc, cb) =>
    {
        if (doc.id)
        {
            doc._id = doc.id;
            delete doc.id;
        }

        let update = 0;
        if (doc._id)
        {
            update = 1;
        }

        const ntsmp = moment().unix();
        if (!update)
        {
            doc.created_time = ntsmp;
        }
        doc.updated_time = ntsmp;

        async.auto({
            schedule: (cb) =>
            {
                if (!update)
                {
                    return cb();
                }

                mongodb.UpdateMany(COLLS.SCHEDULE, { paper: doc._id }, {
                    $set: {
                        paper_name: doc.name
                    }
                }, cb);
            },
            exec: [
                'schedule',
                (dat, cb) =>
                {
                    update ?
                        mongodb.UpdateOne(COLLS.PAPER, { _id: doc._id }, doc, null, 1, cb) :
                        mongodb.InsertOne(COLLS.PAPER, doc, cb);
                }
            ]
        }, cb);
    },
    RemoveMany: (idArr, cb) =>
    {
        async.eachLimit(idArr, 10, (_id, cb) =>
        {
            async.auto({
                notice: (cb) =>
                {
                    notification.Trigger('BeforeRemovePaper', _id, cb);
                },
                remove: [
                    'notice',
                    (dat, cb) =>
                    {
                        mongodb.Remove(COLLS.PAPER, { _id }, cb);
                    }
                ]
            }, () => cb());
        }, cb);
    },
    UpdateScore: (_id, cb) =>
    {
        async.auto({
            questions: (cb) =>
            {
                mongodb.FindOne(COLLS.PAPER, { _id }, {
                    projection: { questions: 1 }
                }, cb);
            },
            score: [
                'questions',
                ({ questions: { questions } }, cb) =>
                {
                    mongodb.GetCollection(COLLS.QUESTION, (err, coll, cb) =>
                    {
                        coll.aggregate([
                            {
                                $match: {
                                    _id: { $in: questions }
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
                                return cb(null, 0);
                            }

                            const { score } = dat[0];
                            cb(null, score);
                        });
                    }, cb);
                }
            ],
            exec: [
                'score',
                ({ score }, cb) =>
                {
                    mongodb.UpdateSingle(COLLS.PAPER, { _id }, {
                        $set: { score }
                    }, cb);
                }
            ]
        }, cb);
    },
    UpdateScoreByQuestion: (_id, cb) =>
    {
        async.auto({
            papers: (cb) =>
            {
                mongodb.FindMany(COLLS.PAPER, { questions: _id }, {
                    projection: { _id: 1 }
                }, cb);
            },
            exec: [
                'papers',
                ({ papers }, cb) =>
                {
                    async.eachLimit(papers, 10, (ins, cb) =>
                    {
                        module.exports.UpdateScore(ins._id, () => cb());
                    }, cb);
                }
            ]
        }, cb);
    },
    RemoveQuestion: (_id, cb) =>
    {
        async.auto({
            papers: (cb) =>
            {
                mongodb.FindMany(COLLS.PAPER, { questions: _id }, {
                    projection: { _id: 1 }
                }, cb);
            },
            exec: [
                'papers',
                ({ papers }, cb) =>
                {
                    async.eachLimit(papers, 10, (ins, cb) =>
                    {
                        async.auto({
                            remove: (cb) =>
                            {
                                mongodb.UpdateSingle(COLLS.PAPER, { _id: ins._id }, {
                                    $pull: { questions: _id }
                                }, null, cb);
                            },
                            update: [
                                'remove',
                                (dat, cb) =>
                                {
                                    module.exports.UpdateScore(ins._id, cb);
                                }
                            ]
                        }, cb);
                    }, cb);
                }
            ]
        }, cb);
    },
    CreateCategory: (ext, subDict, cb) =>
    {
        let parent = null;
        async.auto({
            subject: (cb) =>
            {
                if (!ext.subject)
                {
                    return cb('Pass');
                }

                let ins = subDict[ext.subject];
                if (ins)
                {
                    parent = ins._id;
                    return cb(null, ins.child_dict);
                }

                module.exports.AddCategory(ext.subject, parent, (err, dat) =>
                {
                    if (err)
                    {
                        return cb(err);
                    }

                    subDict[ext.subject] = ins = {
                        _id: dat,
                        name: ext.subject,
                        parent: parent,
                        child_dict: {}
                    };

                    parent = dat;
                    cb(null, ins.child_dict);
                });
            },
            section: [
                'subject',
                ({ subject: secDict }, cb) =>
                {
                    if (!ext.section)
                    {
                        return cb('Pass');
                    }

                    let ins = secDict[ext.section];
                    if (ins)
                    {
                        parent = ins._id;
                        return cb(null, ins.child_dict);
                    }

                    module.exports.AddCategory(ext.section, parent, (err, dat) =>
                    {
                        if (err)
                        {
                            return cb(err);
                        }

                        secDict[ext.section] = ins = {
                            _id: dat,
                            name: ext.section,
                            parent: parent,
                            child_dict: {}
                        };

                        parent = dat;
                        cb(null, ins.child_dict);
                    });
                }
            ],
            knowledge: [
                'section',
                ({ section: knoDict }, cb) =>
                {
                    if (!ext.knowledge)
                    {
                        return cb();
                    }

                    let ins = knoDict[ext.knowledge];
                    if (ins)
                    {
                        parent = ins._id;
                        return cb();
                    }

                    module.exports.AddCategory(ext.knowledge, parent, (err, dat) =>
                    {
                        if (err)
                        {
                            return cb(err);
                        }

                        knoDict[ext.knowledge] = ins = {
                            _id: dat,
                            name: ext.knowledge,
                            parent: parent,
                            child_dict: {}
                        };

                        parent = dat;
                        cb();
                    });
                }
            ]
        }, () =>
        {
            cb(null, parent);
        });
    }
};

notification.Bind('BeforeRemoveQuestion', module.exports.RemoveQuestion);
notification.Bind('AfterUpdateQuestion', module.exports.UpdateScoreByQuestion);
