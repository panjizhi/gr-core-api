const moment = require('moment');
const { COLLS } = require('../includes/decl');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');
const category = require('../dal/category.dal');

module.exports = {
    GetCategories: (cb) =>
    {
        mongodb.GetCollection(COLLS.CANDIDATE_CATEGORY, (err, coll, cb) =>
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
        category.Add(COLLS.CANDIDATE_CATEGORY, name, _pid, cb);
    },
    RemoveCategory: (_id, cb) =>
    {
        async.auto({
            _ids: (cb) =>
            {
                mongodb.GetCollection(COLLS.CANDIDATE_CATEGORY, (err, coll, cb) =>
                {
                    category.LoopIDs(coll, _id, cb);
                }, cb);
            },
            grade: [
                '_ids',
                ({ _ids }, cb) =>
                {
                    mongodb.GetCollection(COLLS.CANDIDATE, (err, coll, cb) =>
                    {
                        coll.updateMany({
                            grade: {
                                $in: _ids
                            }
                        }, {
                            $set: {
                                grade: null
                            }
                        }, cb);
                    }, cb);
                }
            ],
            class: [
                '_ids',
                ({ _ids }, cb) =>
                {
                    mongodb.GetCollection(COLLS.CANDIDATE, (err, coll, cb) =>
                    {
                        coll.updateMany({
                            class: {
                                $in: _ids
                            }
                        }, {
                            $set: {
                                class: null
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
            category.Remove(COLLS.CANDIDATE_CATEGORY, _ids, cb);
        });
    },
    GetMany: (name, _cid, start, count, cb) =>
    {
        async.auto({
            categories: (cb) =>
            {
                if (!_cid)
                {
                    return cb();
                }

                mongodb.GetCollection(COLLS.CANDIDATE_CATEGORY, (err, coll, cb) =>
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
                filter.$or = [
                    {
                        grade: {
                            $in: categories
                        }
                    },
                    {
                        class: {
                            $in: categories
                        }
                    }
                ];
            }
            mongodb.CallPagingModel(COLLS.CANDIDATE, filter, {
                createTime: -1
            }, start, count, cb);
        });
    },
    GetSingle: (_id, cb) =>
    {
        mongodb.GetCollection(COLLS.CANDIDATE, (err, coll, cb) =>
        {
            coll.findOne({ _id: _id }, cb);
        }, cb);
    },
    GetSingleByOPENID: (openid, cb) =>
    {
        mongodb.GetCollection(COLLS.CANDIDATE, (err, coll, cb) =>
        {
            coll.findOne({ openid: openid }, cb);
        }, cb);
    },
    CreateSingle: (openid, name, avatar, cb) =>
    {
        const now = moment();

        const doc = {
            openid: openid,
            name: name,
            avatarUrl: avatar,
            createTime: now.toDate(),
            updated_time: now.unix()
        };
        mongodb.InsertOne(COLLS.CANDIDATE, doc, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            doc._id = dat;
            cb(null, dat);
        });
    },
    SaveSingle: (doc, cb) =>
    {
        const { _id, _grade, _class } = doc;

        const $set = {
            grade: _grade,
            class: _class,
            updated_time: moment().unix()
        };
        mongodb.UpdateOne(COLLS.CANDIDATE, { _id: _id }, $set, null, 0, cb);
    }
};
