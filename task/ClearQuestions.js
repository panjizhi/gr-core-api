const { COLLS } = require('../includes/decl');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');

async.auto({
    questions: (cb) => mongodb.FindMany(COLLS.QUESTION, null, null, cb),
    papers: (cb) => mongodb.FindMany(COLLS.PAPER, null, null, cb),
    exec: [
        'questions',
        'papers',
        ({ questions, papers }, cb) =>
        {
            const qdict = {};
            const dq = [];
            questions.forEach(qus =>
            {
                if (qus.qtype >= 2)
                {
                    return true;
                }

                qus.key = qus._id.toHexString();

                const key = [(() => qus.name), (() => qus.name + '-' + qus.content.text)][qus.qtype]();
                const ins = qdict[key];
                if (ins)
                {
                    ins.value.push(qus);
                    if (ins.value.length <= 2)
                    {
                        dq.push(ins);
                    }
                }
                else
                {
                    qdict[key] = {
                        value: [qus]
                    };
                }
            });

            const transfer = [];
            dq.forEach(ins =>
            {
                const arr = ins.value;

                const val = [
                    () =>
                    {
                        let first = arr[0];
                        for (let i = 1, l = arr.length; i < l; ++i)
                        {
                            const ins = arr[i];
                            try
                            {
                                if (!first.content.options || !first.content.options.length || (ins.content.options && ins.content.options.length > first.content.options.length))
                                {
                                    first = ins;
                                }
                            }
                            catch (ex)
                            {
                                console.log(ex);
                            }
                        }
                        return first;
                    },
                    () =>
                    {
                        return arr[0];
                    }
                ][arr[0].qtype]();

                arr.forEach(ins =>
                {
                    if (ins.key !== val.key)
                    {
                        transfer.push({
                            from: ins,
                            to: val
                        });
                    }
                });
            });

            async.eachLimit(transfer, 10, (ins, cb) =>
            {
                async.auto({
                    paper: (cb) =>
                    {
                        mongodb.UpdateMany(COLLS.PAPER, { questions: ins.from._id }, {
                            $set: {
                                'questions.$': ins.to._id
                            }
                        }, cb);
                    },
                    question: [
                        'paper',
                        (dat, cb) =>
                        {
                            mongodb.Remove(COLLS.QUESTION, { _id: ins.from._id }, cb);
                        }
                    ]
                }, cb);
            }, cb);
        }
    ]
}, () =>
{
    process.exit();
});


