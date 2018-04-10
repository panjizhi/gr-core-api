const moment = require('moment');
const { COLLS } = require('../includes/decl');
const common = require('../includes/common');
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
            classes: [
                '_ids',
                ({ _ids }, cb) =>
                {
                    mongodb.UpdateMany(COLLS.CANDIDATE, null, {
                        $pull: { classes: _id }
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
                filter.classes = { $in: categories };
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
    SaveSingle: (id, classes, cb) =>
    {
        mongodb.UpdateOne(COLLS.CANDIDATE, { _id: id }, {
            classes: classes,
            updated_time: moment().unix()
        }, null, 0, cb);
    },
    RemoveMany: (idArr, cb) =>
    {
        mongodb.Remove(COLLS.CANDIDATE, {
            _id: { $in: idArr }
        }, cb);
    },
    SaveClassesMany: (candidates, classes, cb) =>
    {
        const ntsmp = moment().unix();
        async.eachLimit(classes, 10, (ins, cb) => async.auto({
            query: (cb) => mongodb.FindMany(COLLS.CANDIDATE, {
                _id: { $in: candidates },
                classes: { $ne: ins }
            }, cb),
            update: [
                'query',
                ({ query }, cb) =>
                {
                    if (!query.length)
                    {
                        return cb();
                    }

                    mongodb.UpdateMany(COLLS.CANDIDATE, {
                        _id: { $in: query.map(ins => ins._id) }
                    }, {
                        $push: { classes: ins },
                        $set: { updated_time: ntsmp }
                    }, cb);
                }
            ]
        }, cb), cb);
    },
    GetCalendar: (_cid, begin, end, cb) =>
    {
        end += 24 * 60 * 60;
        mongodb.FindMany(COLLS.RESULT, {
            author: _cid,
            created_time: {
                $gte: begin,
                $lt: end
            }
        }, {
            projection: {
                _id: 1,
                created_time: 1
            }
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            if (!dat)
            {
                return cb();
            }

            const dict = {};
            dat.forEach(ins =>
            {
                const key = moment.unix(ins.created_time).format('YYYY-MM-DD');
                if (!(key in dict))
                {
                    dict[key] = [];
                }

                dict[key].push(ins._id);
            });

            cb(null, dict);
        });
    },
    GetDateReport: (_cid, date, cb) =>
    {
        async.auto({
            results: (cb) =>
            {
                mongodb.FindMany(COLLS.RESULT, {
                    author: _cid,
                    'paper.category': mongodb.CreateObjectID('5ac3305769ce5c10704a41ca'),
                    created_time: {
                        $gte: date,
                        $lt: date + 24 * 60 * 60
                    }
                }, {
                    sort: {
                        'paper.category': -1,
                        'paper._id': -1
                    }
                }, cb);
            },
            categories: [
                'results',
                ({ results }, cb) =>
                {
                    if (!results.length)
                    {
                        return cb();
                    }

                    const _ids = [];
                    results.forEach(({ paper }) => paper.category && _ids.push(paper.category));

                    mongodb.FindMany(COLLS.PAPER_CATEGORY, { _id: { $in: _ids } }, cb);
                }
            ],
            exec: [
                'results',
                'categories',
                ({ results, categories }, cb) =>
                {
                    const cdict = {};
                    categories && categories.forEach((ins) => cdict[ins._id.toHexString()] = ins);

                    const papers = {};
                    results.forEach(r =>
                    {
                        const { paper: rp } = r;

                        const id = rp._id.toHexString();
                        if (!(id in papers))
                        {
                            papers[id] = {
                                count: 0,
                                duration: 0,
                                full_score: 0,
                                score: 0
                            };
                        }

                        const p = papers[id];
                        if (!p.category && rp.category)
                        {
                            const cat = cdict[rp.category.toHexString()];
                            if (cat)
                            {
                                p.category = cat._id;
                                p.category_name = cat.name;
                            }
                        }
                        if (!p.name && rp.name)
                        {
                            p.name = rp.name;
                        }
                        ++p.count;
                        if (!p.duration || (r.duration && r.duration < p.duration))
                        {
                            p.duration = r.duration;
                        }
                        if (!p.full_score && rp.score)
                        {
                            p.full_score = rp.score;
                        }
                        if (!p.score || r.score > p.score)
                        {
                            p.score = r.score;
                        }
                    });

                    cb(null, Object.values(papers));
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
    },
    GetClassReport: (_class, date, cb) =>
    {
        const m = moment.unix(date);
        date = moment([m.year(), m.month(), m.date()]).unix();

        async.auto({
            categories: (cb) =>
            {
                mongodb.GetCollection(COLLS.CANDIDATE_CATEGORY, (err, coll, cb) => category.LoopIDs(coll, _class, cb), cb);
            },
            candidates: [
                'categories',
                ({ categories }, cb) =>
                {
                    mongodb.FindMany(COLLS.CANDIDATE, {
                        classes: { $in: categories }
                    }, {
                        projection: {
                            _id: 1,
                            name: 1
                        }
                    }, (err, dat) =>
                    {
                        if (err)
                        {
                            return cb(err);
                        }

                        const dict = {};
                        dat.forEach(ins => dict[ins._id.toHexString()] = ins);

                        cb(null, {
                            ids: dat.map(ins => ins._id),
                            dict
                        });
                    });
                }
            ],
            schedules: (cb) => async.auto({
                query: (cb) =>
                {
                    mongodb.FindMany(COLLS.AUTO_SCHEDULE, null, cb);
                },
                papers: [
                    'query',
                    ({ query }, cb) =>
                    {
                        if (!query || !query.length)
                        {
                            return cb();
                        }

                        const dict = {};
                        query.forEach(ins => ins.flow.forEach(pid =>
                        {
                            const _id = pid.toHexString();
                            if (!dict[_id])
                            {
                                dict[_id] = pid;
                            }
                        }));

                        mongodb.FindMany(COLLS.PAPER, {
                            _id: { $in: Object.values(dict) },
                            name: /^[A-Z]{1}\w*/i
                        }, cb);
                    }
                ],
                exec: [
                    'query',
                    'papers',
                    ({ query, papers }, cb) =>
                    {
                        if (!papers || !papers.length)
                        {
                            return cb();
                        }

                        const pdict = {};
                        papers.forEach(ins => pdict[ins._id.toHexString()] = ins);

                        const dict = {};
                        query.forEach(ins =>
                        {
                            const idc = {};

                            let count = 0;
                            ins.flow.forEach(pid =>
                            {
                                const _id = pid.toHexString();
                                const p = pdict[_id];
                                count += p ? p.questions.length : 0;
                                idc[_id] = count;
                            });

                            dict[ins._id.toHexString()] = idc;
                        });

                        cb(null, dict);
                    }
                ]
            }, (err, dat) =>
            {
                if (err)
                {
                    return cb(err);
                }

                cb(null, dat.exec || {});
            }),
            day: [
                'candidates',
                ({ candidates }, cb) =>
                {
                    mongodb.FindMany(COLLS.RESULT, {
                        author: { $in: candidates.ids },
                        created_time: {
                            $gte: date,
                            $lt: date + 24 * 60 * 60
                        }
                    }, cb);
                }
            ],
            week: [
                'candidates',
                ({ candidates }, cb) =>
                {
                    const dm = moment.unix(date);
                    dm.subtract(dm.day(), 'd');
                    const ws = dm.unix();

                    mongodb.FindMany(COLLS.RESULT, {
                        author: { $in: candidates.ids },
                        created_time: {
                            $gte: ws,
                            $lt: ws + 7 * 24 * 60 * 60
                        }
                    }, {
                        sort: { created_time: -1 }
                    }, cb);
                }
            ],
            count: [
                'candidates',
                'day',
                ({ candidates: { ids, dict: cdict }, day }, cb) =>
                {
                    const rdict = {};
                    day.forEach(ins =>
                    {
                        const cid = ins.author.toHexString();

                        let dins = rdict[cid];
                        if (!dins)
                        {
                            rdict[cid] = dins = {
                                count: 0,
                                candidate: cdict[cid]
                            };
                        }

                        ++dins.count;
                    });

                    const report = Object.values(rdict).map(ins => ({
                        name: ins.candidate ? ins.candidate.name : null,
                        count: ins.count
                    }));

                    report.sort((a, b) => a.count > b.count ? -1 : 1);
                    report.forEach((ins, i) => ins.ranking = `第${i + 1}名`);

                    cb(null, report);
                }
            ],
            diligent: [
                'candidates',
                'week',
                ({ candidates: { ids, dict: cdict }, week }, cb) =>
                {
                    const rdict = {};
                    week.forEach(ins =>
                    {
                        const cid = ins.author.toHexString();

                        let dins = rdict[cid];
                        if (!dins)
                        {
                            rdict[cid] = dins = {
                                count: 0,
                                candidate: cdict[cid]
                            };
                        }

                        ++dins.count;
                    });

                    const report = Object.values(rdict).map(ins => ({
                        name: ins.candidate ? ins.candidate.name : null,
                        count: ins.count,
                        count_per_day: Math.ceil(ins.count / 7)
                    }));

                    report.sort((a, b) => a.count > b.count ? -1 : 1);
                    report.forEach((ins, i) => ins.ranking = `第${i + 1}名`);

                    cb(null, report);
                }
            ],
            progress: [
                'candidates',
                'week',
                'schedules',
                ({ candidates: { ids, dict: cdict }, week, schedules }, cb) =>
                {
                    const rdict = {};
                    week.forEach(ins =>
                    {
                        const cid = ins.author.toHexString();

                        let dins = rdict[cid];
                        if (!dins)
                        {
                            rdict[cid] = dins = {
                                candidate: cdict[cid],
                                results: []
                            };
                        }

                        dins.results.push(ins);
                    });

                    const cs = Object.values(rdict);
                    cs.forEach(ins =>
                    {
                        ins.results.forEach(r =>
                        {
                            if (!ins.break && r.auto)
                            {
                                const sch = schedules[r.auto];
                                if (sch)
                                {
                                    const _pid = r.paper._id.toHexString();
                                    if (_pid in sch)
                                    {
                                        const count = sch[_pid];
                                        if (!ins.count || count > ins.count)
                                        {
                                            ins.count = count;
                                        }
                                    }
                                }
                            }
                        });

                        if (common.IsUndefined(ins.count))
                        {
                            ins.count = ins.results[0].paper.questions.length;
                        }
                    });

                    const report = cs.map(ins => ({
                        name: ins.candidate ? ins.candidate.name : null,
                        progress: ins.count,
                        target: 3500
                    }));

                    report.sort((a, b) => a.progress > b.progress ? -1 : 1);
                    report.forEach((ins, i) => ins.ranking = `第${i + 1}名`);

                    cb(null, report);
                }
            ]
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            const { count, progress, diligent } = dat;
            cb(null, {
                count,
                progress,
                diligent
            });
        });
    }
};
