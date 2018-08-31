const moment = require('moment');
const { COLLS } = require('../includes/decl');
const common = require('../includes/common');
const utils = require('../includes/utils');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');
const notification = require('../dal/notification');

module.exports = {
    GetMany: (_pid, paperName, _cid, candidateName, done, sorter, mcls, start, count, cb) =>
    {
        const $and = [];
        const $or = [];

        if (paperName)
        {
            $or.push({
                paper_name: {
                    $regex: paperName,
                    $options: 'i'
                }
            });
        }
        if (candidateName)
        {
            $or.push({
                candidate_name: {
                    $regex: candidateName,
                    $options: 'i'
                }
            });
        }
        if (!common.IsUndefined(done) && done !== null)
        {
            $and.push({ isDone: !!done });
        }

        const srt = sorter || {};
        common.Extend(srt, { updated_time: -1 }, 1);

        async.auto({
            candidates: (cb) =>
            {
                if (!mcls)
                {
                    return cb();
                }

                mongodb.FindMany(COLLS.CANDIDATE, { classes: { $in: mcls } }, (err, dat) =>
                {
                    if (err)
                    {
                        return cb(err);
                    }

                    $and.push({
                        student: { $in: dat.map(ins => ins._id) }
                    });

                    cb();
                });
            },
            filter: [
                'candidates',
                (dat, cb) =>
                {
                    if ($or.length)
                    {
                        $and.push({ $or });
                    }

                    if (!$and.length)
                    {
                        return cb();
                    }

                    cb(null, { $and });
                }
            ],
            schedules: [
                'filter',
                ({ filter }, cb) =>
                {
                    mongodb.CallPagingModel(COLLS.SCHEDULE, filter, srt, start, count, (err, dat) =>
                    {
                        if (err)
                        {
                            return cb(err);
                        }

                        if (!dat.records.length)
                        {
                            return cb(null, dat);
                        }

                        dat.records.forEach(ins => ins.candidate = ins.student);

                        cb(null, dat);
                    });
                }
            ],
            papers: [
                'schedules',
                ({ schedules }, cb) =>
                {
                    if (!schedules.records.length)
                    {
                        return cb();
                    }

                    const _ids = schedules.records.map(ins => ins.paper);
                    mongodb.FindMany(COLLS.PAPER, {
                        _id: { $in: _ids }
                    }, {
                        projection: {
                            _id: 1,
                            score: 1
                        }
                    }, (err, dat) =>
                    {
                        if (err)
                        {
                            return cb();
                        }

                        const dict = {};
                        dat.forEach(ins => dict[ins._id.toHexString()] = ins.score);

                        schedules.records.forEach(ins => ins.full_score = dict[ins.paper.toHexString()]);

                        cb();
                    });
                }
            ]
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            cb(null, dat.schedules);
        });
    },
    GetSingle: (_id, cb) => mongodb.FindOne(COLLS.SCHEDULE, { _id }, cb),
    GetUndone: (_cid, cb) =>
    {
        mongodb.GetCollection(COLLS.SCHEDULE, (err, coll, cb) =>
        {
            coll.find({
                student: _cid,
                isDone: false
            }).toArray(cb);
        }, cb);
    },
    GetAutoMany: (limit, detail, login, cb) =>
    {
        async.auto({
            schedules: (cb) =>
            {
                let query = null;
                const { level, subjects } = login;
                if (level > 1)
                {
                    if (!subjects || !subjects.length)
                    {
                        return cb(null, []);
                    }

                    const co = { subjects };
                    if (mongodb.Convert(co, { subjects: 1 }))
                    {
                        return cb('Can not convert.');
                    }

                    query = {
                        subject: { $in: subjects }
                    };
                }

                mongodb.FindMany(COLLS.AUTO_SCHEDULE, query, {
                    sort: { updated_time: -1 }
                }, cb);
            },
            papers: [
                'schedules',
                ({ schedules }, cb) =>
                {
                    limit && schedules.forEach(ins =>
                    {
                        if (ins.flow.length > limit)
                        {
                            ins.more = 1;
                            ins.flow = ins.flow.slice(0, limit);
                        }
                    });

                    const _ids = [];
                    schedules.forEach(ins => ins.flow.forEach((_pid, i) => _ids.push(_pid)));

                    if (!_ids.length)
                    {
                        return cb();
                    }

                    const opts = {};
                    if (!detail)
                    {
                        opts.projection = {
                            _id: 1,
                            name: 1
                        };
                    }

                    mongodb.FindMany(COLLS.PAPER, {
                        _id: { $in: _ids }
                    }, opts, cb);
                }
            ]
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            const { schedules, papers } = dat;

            const pdict = {};
            papers && papers.forEach(ins => pdict[ins._id.toHexString()] = ins);

            schedules.forEach(schedule =>
            {
                if (!schedule.flow.length)
                {
                    return true;
                }

                const flow = [];
                schedule.flow.forEach(ins =>
                {
                    const paper = pdict[ins.toHexString()];
                    paper && flow.push(paper);
                });

                schedule.flow = flow;
            });

            cb(null, schedules);
        });
    },
    GetAutoQueueMany: (tsmp, cb) =>
    {
        mongodb.FindMany(COLLS.AUTO_SCHEDULE_QUEUE, {
            created_time: { $lte: tsmp }
        }, null, cb);
    },
    GetAutoSingle: (_id, cb) =>
    {
        async.auto({
            schedule: (cb) =>
            {
                mongodb.FindOne(COLLS.AUTO_SCHEDULE, { _id }, null, cb);
            },
            papers: [
                'schedule',
                ({ schedule }, cb) =>
                {
                    if (!schedule.flow || !schedule.flow.length)
                    {
                        return cb();
                    }

                    mongodb.FindMany(COLLS.PAPER, {
                        _id: { $in: schedule.flow }
                    }, {
                        projection: {
                            _id: 1,
                            name: 1
                        }
                    }, cb);
                }
            ]
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            const { schedule, papers } = dat;

            if (schedule.flow && schedule.flow.length)
            {
                const pdict = {};
                papers.forEach(ins => pdict[ins._id.toHexString()] = ins);

                const flow = [];
                schedule.flow.forEach(ins =>
                {
                    const paper = pdict[ins.toHexString()];
                    paper && flow.push(paper);
                });

                schedule.flow = flow;
            }

            cb(null, schedule);
        });
    },
    SaveSingle: (_cid, cname, _pid, pname, _aid, code, cb) =>
    {
        const ntsmp = moment().unix();
        const doc = {
            student: _cid,
            candidate_name: cname,
            paper: _pid,
            paper_name: pname,
            isDone: false,
            created_time: ntsmp,
            updated_time: ntsmp
        };
        if (_aid)
        {
            doc.auto = _aid;
            doc.code = code;
        }
        mongodb.InsertOne(COLLS.SCHEDULE, doc, cb);
    },
    SaveMany: (candidates, papers, cb) =>
    {
        function CreateObjectIDArr(arr)
        {
            const rlt = [];
            arr.forEach(ins =>
            {
                const _id = mongodb.CreateObjectID(ins.id);
                if (_id)
                {
                    ins._id = _id;
                    rlt.push(ins);
                }
            });
            return rlt;
        }

        const carr = CreateObjectIDArr(candidates);
        const parr = CreateObjectIDArr(papers);
        if (!carr.length || !parr.length)
        {
            return cb();
        }

        const ntsmp = moment().unix();

        const rlt = [];
        carr.forEach(cins => parr.forEach(pins =>
        {
            const dat = {
                student: cins._id,
                candidate_name: cins.name,
                paper: pins._id,
                paper_name: pins.name,
                isDone: false,
                created_time: ntsmp,
                updated_time: ntsmp
            };
            if (pins.auto)
            {
                const _aid = mongodb.CreateObjectID(pins.auto);
                if (_aid)
                {
                    dat.auto = _aid;
                    dat.code = utils.CreateNormalID();
                }
            }
            rlt.push(dat);
        }));

        mongodb.GetCollection(COLLS.SCHEDULE, (err, coll, cb) =>
        {
            coll.insertMany(rlt, cb);
        }, cb);
    },
    SaveAutoSingle: (_id, name, subject, flow, cb) =>
    {
        const ntsmp = moment().unix();
        const doc = {
            name,
            subject,
            flow,
            created_time: ntsmp,
            updated_time: ntsmp
        };

        _id ? mongodb.UpdateOne(COLLS.AUTO_SCHEDULE, { _id }, doc, null, 1, cb) : mongodb.InsertOne(COLLS.AUTO_SCHEDULE, doc, cb);
    },
    SaveAutoQueueSingle: (_auto, result, ntsmp, cb) =>
    {
        const doc = {
            auto: _auto,
            result: result,
            created_time: ntsmp,
            updated_time: ntsmp
        };
        mongodb.InsertOne(COLLS.AUTO_SCHEDULE_QUEUE, doc, cb);
    },
    RemoveMany: (idArr, cb) =>
    {
        async.eachLimit(idArr, 10, (_id, cb) => mongodb.Remove(COLLS.SCHEDULE, { _id }, () => cb()), cb);
    },
    UpdateSingle: (_id, beginTime, endTime, duration, score, _rid, cb) =>
    {
        mongodb.UpdateOne(COLLS.SCHEDULE, { _id }, {
            isDone: true,
            exam_time: beginTime,
            duration,
            score,
            completed_time: endTime,
            result: _rid,
            updated_time: endTime
        }, null, 0, cb);
    },
    RemoveAutoSingle: (_id, cb) =>
    {
        async.auto({
            papers: (cb) => module.exports.ClearAutoSchedule(_id, cb),
            schedule:
                (cb) => mongodb.Remove(COLLS.AUTO_SCHEDULE, { _id }, cb)
        }, cb);
    },
    RemoveAutoQueueSingle: (_id, cb) => mongodb.Remove(COLLS.AUTO_SCHEDULE_QUEUE, { _id }, cb),
    ClearAutoSchedule: (_AS_ID, cb) =>
    {
        mongodb.UpdateMany(COLLS.PAPER, { auto_schedule: _AS_ID }, {
            $set: { auto_schedule: null }
        }, cb);
    },
    RemovePaper: (_id, cb) =>
    {
        async.auto({
            schedules: (cb) =>
            {
                mongodb.Remove(COLLS.SCHEDULE, { paper: _id }, cb);
            },
            auto: (cb) =>
            {
                mongodb.UpdateMany(COLLS.AUTO_SCHEDULE, { flow: _id }, {
                    $pull: { flow: _id }
                }, cb);
            }
        }, cb);
    }
};

notification.Bind('BeforeRemovePaper', module.exports.RemovePaper);
