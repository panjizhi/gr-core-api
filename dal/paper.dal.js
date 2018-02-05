const moment = require('moment');
const { COLLS } = require('../includes/decl');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');
const category = require('../dal/category.dal');

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
                filter['name'] = {
                    $regex: name,
                    $options: 'i'
                };
            }
            if (categories)
            {
                filter['category'] = {
                    $in: categories
                };
            }
            if (_qid)
            {
                filter['questions'] = _qid;
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
        let update = 0;
        if (doc._id)
        {
            delete doc.id;
            update = 1;
        }

        if (doc._category)
        {
            doc.category = doc._category;
            delete doc._category;
        }

        if (doc.questions && doc.questions.length)
        {
            doc.questions = mongodb.CreateObjectIDArr(doc.questions);
        }

        const ntsmp = moment().unix();
        doc.created_time = ntsmp;
        doc.updated_time = ntsmp;

        async.auto({
            schedule: (cb) =>
            {
                if (!update)
                {
                    return cb();
                }

                mongodb.GetCollection(COLLS.SCHEDULE, (err, coll, cb) =>
                {
                    coll.updateMany({
                        paper: doc._id
                    }, {
                        $set: {
                            paper_name: doc.name
                        }
                    }, cb);
                }, cb);
            }
        }, (err) =>
        {
            if (err)
            {
                return cb(err);
            }

            update ? mongodb.UpdateOne(COLLS.PAPER, { _id: doc._id }, doc, null, 1, cb) : mongodb.InsertOne(COLLS.PAPER, doc, cb);
        });
    },
    RemoveSingle: (_id, cb) =>
    {
        async.auto({
            schedules: (cb) =>
            {
                mongodb.GetCollection(COLLS.SCHEDULE, (err, coll, cb) => coll.remove({ paper: _id }, cb), cb);
            },
            exec: [
                'schedules',
                ({ schedules }, cb) =>
                {
                    mongodb.GetCollection(COLLS.PAPER, (err, coll, cb) => coll.remove({ _id }, cb), cb);
                }
            ]
        }, cb);
    }
};
