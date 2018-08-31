const moment = require('moment');
const async = require('../includes/workflow');
const ftt = require('../includes/FullTimeTask');
const candidateDAL = require('../dal/candidate.dal');
const paperDAL = require('../dal/paper.dal');
const resultDAL = require('../dal/result.dal');
const scheduleDAL = require('../dal/schedule.dal');
const systemDAL = require('../dal/system.dal');

const __WAIT_SECONDS = 5 * 60;
const __MAX_COUNT = 2;
const __RIGHT_COUNT = 2;

ftt.Start(0, 10, (cb) =>
{
    const tsmp = moment().unix();

    async.auto({
        time: (cb) =>
        {
            systemDAL.GetOptions('auto-schedule', (err, dat) =>
            {
                cb(null, tsmp - (err || !dat || !dat.duration ? __WAIT_SECONDS : dat.duration));
            });
        },
        queue: [
            'time',
            ({ time }, cb) =>
            {
                scheduleDAL.GetAutoQueueMany(time, (err, dat) =>
                {
                    if (err)
                    {
                        return cb(err);
                    }

                    if (!dat.length)
                    {
                        return cb('Not found.');
                    }

                    cb(null, dat);
                });
            }
        ],
        auto: [
            'queue',
            ({ queue }, cb) => scheduleDAL.GetAutoMany(0, 0, (err, dat) =>
            {
                if (err)
                {
                    return cb(err);
                }

                dat.forEach(a =>
                {
                    const pdict = {};
                    a.flow.forEach((p, i) =>
                    {
                        const ps = {};
                        if (i < a.flow.length - 1)
                        {
                            ps.next = a.flow[i + 1];
                        }

                        pdict[p._id.toHexString()] = ps;
                    });

                    a.flow_dict = pdict;
                });

                const adict = {};
                dat.forEach(ins => adict[ins._id.toHexString()] = ins);

                cb(null, adict);
            })
        ],
        check: [
            'queue',
            'auto',
            ({ queue, auto }, cb) =>
            {
                const schs = [];
                async.eachLimit(queue, 10, (ins, cb) =>
                {
                    const _id = ins._id;
                    const _aid = ins.auto;
                    const result = ins.result;
                    const code = result.code;
                    const paper = result.paper;
                    const _pid = paper._id;
                    const _cid = result.author;

                    const ains = auto[_aid.toHexString()];
                    if (!ains)
                    {
                        ExecSchedule();
                        return cb();
                    }

                    const ps = ains.flow_dict[_pid.toHexString()];
                    if (!ps)
                    {
                        ExecSchedule();
                        return cb();
                    }

                    resultDAL.GetSinglePaperMany(_cid, _pid, code, __MAX_COUNT, (err, dat) =>
                    {
                        if (err)
                        {
                            return cb();
                        }

                        if (dat.length < __RIGHT_COUNT)
                        {
                            ExecSchedule(_pid);
                            return cb();
                        }

                        let count = 0;
                        dat.forEach(rlt => (rlt.score >= rlt.paper.score - 1) && ++count);

                        if (count < __RIGHT_COUNT)
                        {
                            ExecSchedule(_pid);
                            return cb();
                        }

                        ExecSchedule(ps.next ? ps.next._id : null);
                        return cb();
                    });

                    function ExecSchedule(_pid)
                    {
                        schs.push({
                            _id,
                            _cid,
                            _aid,
                            code,
                            _pid
                        });
                    }
                }, (err) =>
                {
                    if (err)
                    {
                        return cb(err);
                    }

                    cb(null, schs);
                });
            }
        ],
        exec: [
            'check',
            ({ check }, cb) =>
            {
                async.eachLimit(check, 10, ({ _id, _cid, _aid, code, _pid }, cb) =>
                {
                    async.auto({
                        queue: (cb) => scheduleDAL.RemoveAutoQueueSingle(_id, cb),
                        schedule: (cb) =>
                        {
                            if (!_pid)
                            {
                                return cb();
                            }

                            async.auto({
                                candidate: (cb) => candidateDAL.GetSingle(_cid, cb),
                                paper: (cb) => paperDAL.GetSingle(_pid, cb),
                                schedule: [
                                    'candidate',
                                    'paper',
                                    ({ candidate, paper }, cb) =>
                                    {
                                        scheduleDAL.SaveSingle(_cid, candidate.name, _pid, paper.name, _aid, code, cb);
                                    }
                                ]
                            }, cb);
                        }
                    }, cb);
                }, cb);
            }
        ]
    }, (err) => err ? ftt.ReturnFree(cb) : ftt.ReturnBusy(cb));
});
