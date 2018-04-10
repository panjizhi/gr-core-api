const { COLLS } = require('../includes/decl');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');
const scheduleDAL = require('../dal/schedule.dal');

let count = 0;

async.auto({
    results: (cb) =>
    {
        mongodb.FindMany(COLLS.RESULT, null, cb);
    },
    exec: [
        'results',
        ({ results }, cb) =>
        {
            async.eachLimit(results, 5, ({ _id, code, schedule: sch, auto }, cb) =>
            {
                if (!code || auto)
                {
                    return cb();
                }

                async.auto({
                    schedule: (cb) =>
                    {
                        scheduleDAL.GetSingle(sch, cb);
                    },
                    exec: [
                        'schedule',
                        ({ schedule: { auto } }, cb) =>
                        {
                            if (!auto)
                            {
                                return cb();
                            }

                            mongodb.UpdateSingle(COLLS.RESULT, { _id }, {
                                $set: { auto }
                            }, () =>
                            {
                                ++count;
                                console.log(count);
                                cb();
                            });
                        }
                    ]
                }, () => cb());
            }, cb);
        }
    ]
}, () =>
{
    console.log(`Completed ${count}`);
    process.exit();
});
