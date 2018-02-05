const moment = require('moment');
const { COLLS } = require('../includes/decl');
const common = require('../includes/common');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');
const category = require('../dal/category.dal');

module.exports = {
    GetCategories: (cb) =>
    {
        mongodb.GetCollection(COLLS.QUESTION_CATEGORY, (err, coll, cb) =>
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
        category.Add(COLLS.QUESTION_CATEGORY, name, _pid, cb);
    },
    RemoveCategory: (_id, cb) =>
    {
        async.auto({
            _ids: (cb) =>
            {
                mongodb.GetCollection(COLLS.QUESTION_CATEGORY, (err, coll, cb) =>
                {
                    category.LoopIDs(coll, _id, cb);
                }, cb);
            },
            questions: [
                '_ids',
                ({ _ids }, cb) =>
                {
                    mongodb.GetCollection(COLLS.QUESTION, (err, coll, cb) =>
                    {
                        async.auto({
                            subject: (cb) =>
                            {
                                coll.updateMany({
                                    subject: {
                                        $in: _ids
                                    }
                                }, {
                                    $set: {
                                        subject: null
                                    }
                                }, cb);
                            },
                            knowledges: (cb) =>
                            {
                                coll.updateMany({}, {
                                    $pull: {
                                        knowledges: {
                                            $in: _ids
                                        }
                                    }
                                }, cb);
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
            category.Remove(COLLS.QUESTION_CATEGORY, _ids, cb);
        });
    },
    GetMany: (name, _cid, sorter, start, count, cb) =>
    {
        async.auto({
            categories: (cb) =>
            {
                if (!_cid)
                {
                    return cb();
                }

                mongodb.GetCollection(COLLS.QUESTION_CATEGORY, (err, coll, cb) =>
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
                filter['$or'] = [
                    {
                        subject: {
                            $in: categories
                        }
                    },
                    {
                        knowledges: {
                            $in: categories
                        }
                    }
                ];
            }
            const srt = sorter || {};
            common.Extend(srt, {
                updated_time: -1
            }, 1);
            mongodb.CallPagingModel(COLLS.QUESTION, filter, srt, start, count, cb);
        });
    },
    GetSingle: (_id, cb) =>
    {
        mongodb.GetCollection(COLLS.QUESTION, (err, coll, cb) =>
        {
            coll.findOne({
                _id: _id
            }, cb);
        }, cb);
    },
    SaveSingle: (doc, cb) =>
    {
        let update = 0;
        if (doc._id)
        {
            delete doc.id;
            update = 1;
        }

        if (doc._subject)
        {
            doc.subject = doc._subject;
            delete doc._subject;
        }

        if (doc.knowledges && doc.knowledges.length)
        {
            doc.knowledges = mongodb.CreateObjectIDArr(doc.knowledges);
        }

        const ntsmp = moment().unix();
        doc.created_time = ntsmp;
        doc.updated_time = ntsmp;

        update ? mongodb.UpdateOne(COLLS.QUESTION, { _id: doc._id }, doc, null, 1, cb) : mongodb.InsertOne(COLLS.QUESTION, doc, cb);
    },
    SaveMany: (arr, cb) =>
    {
        const ntsmp = moment().unix();
        arr.forEach(ins => ins.updated_time = ins.created_time = ntsmp);

        mongodb.GetCollection(COLLS.QUESTION, (err, coll, cb) =>
        {
            coll.insertMany(arr, cb);
        }, cb);
    },
    RemoveSingle: (_id, cb) =>
    {
        const ntsmp = moment().unix();
        async.auto({
            papers: (cb) =>
            {
                mongodb.GetCollection(COLLS.PAPER, (err, coll, cb) =>
                {
                    coll.updateMany({
                        questions: _id
                    }, {
                        $pull: {
                            questions: _id
                        },
                        $set: {
                            updated_time: ntsmp
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

            mongodb.GetCollection(COLLS.QUESTION, (err, coll, cb) =>
            {
                coll.remove({
                    _id: _id
                }, cb);
            }, cb);
        });
    },
    UpdateSingle: (_id, isWrong, time, cb) =>
    {
        async.auto({
            instance: (cb) =>
            {
                module.exports.GetSingle(_id, cb);
            }
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            const { instance } = dat;
            let total = instance.total || 0;
            let wrong = instance.wrong || 0;

            ++total;
            isWrong && ++wrong;

            const rate = parseInt(Math.ceil(wrong * 100 / total));

            mongodb.UpdateOne(COLLS.QUESTION, { _id }, {
                total,
                wrong,
                wrong_rate: rate,
                updated_time: time
            }, null, 0, cb);
        });
    },
    Troubleshoot: (ins) =>
    {
        if (!common.IsUndefined(ins.qtype))
        {
            return;
        }

        ins.qtype = 0;

        const { options, answer } = ins;
        const rightIndex = answer.charCodeAt() - 65;

        const vArr = [];
        options && options.length && options.forEach((ins, i) => vArr.push({
            title: ins.replace(/^[A-Z.\s]*/g, ''),
            right: i === rightIndex ? 1 : 0
        }));

        ins.content = {
            options: vArr,
            right: rightIndex
        };
    }
};
