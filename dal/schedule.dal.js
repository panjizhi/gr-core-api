const moment = require('moment');
const { COLLS } = require('../includes/decl');
const common = require('../includes/common');
const mongodb = require('../drivers/mongodb');

module.exports = {
    GetMany: (_pid, paperName, _cid, candidateName, done, sorter, start, count, cb) =>
    {
        let incr = 0;
        const or = [];
        let filter = {
            $or: or
        };
        if (paperName)
        {
            ++incr;
            or.push({
                paper_name: {
                    $regex: paperName,
                    $options: 'i'
                }
            });
        }
        if (candidateName)
        {
            ++incr;
            or.push({
                candidate_name: {
                    $regex: candidateName,
                    $options: 'i'
                }
            });
        }
        if (!common.IsUndefined(done) && done !== null)
        {
            ++incr;
            filter.isDone = !!done;
        }
        if (incr)
        {
            if (!or.length)
            {
                delete filter.$or;
            }
        }
        else
        {
            filter = {};
        }
        const srt = sorter || {};
        common.Extend(srt, {
            updated_time: -1
        }, 1);
        mongodb.CallPagingModel(COLLS.SCHEDULE, filter, srt, start, count, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            if (!dat.total)
            {
                return cb(null, dat);
            }

            dat.records.forEach(ins => ins.candidate = ins.student);

            cb(null, dat);
        });
    },
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
        carr.forEach(cins => parr.forEach(pins => rlt.push({
            student: cins._id,
            candidate_name: cins.name,
            paper: pins._id,
            paper_name: pins.name,
            isDone: false,
            created_time: ntsmp,
            updated_time: ntsmp
        })));

        mongodb.GetCollection(COLLS.SCHEDULE, (err, coll, cb) =>
        {
            coll.insertMany(rlt, cb);
        }, cb);
    },
    RemoveSingle: (_id, cb) =>
    {
        mongodb.GetCollection(COLLS.SCHEDULE, (err, coll, cb) =>
        {
            coll.remove({
                _id: _id
            }, cb);
        }, cb);
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
    }
};
