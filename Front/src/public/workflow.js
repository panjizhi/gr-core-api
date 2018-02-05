import { CompareType } from './index';
import async from 'async';

let instc = {};
for (let key in async)
{
    if (!async.hasOwnProperty(key))
    {
        continue;
    }

    instc[key] = async[key];
}

instc.auto = (model, cb) =>
{
    let dict = {};
    let terr = null;
    let first = [];
    let deps = {};
    let beds = {};

    for (let key in model)
    {
        if (!model.hasOwnProperty(key))
        {
            continue;
        }

        let val = model[key];
        let func = null;
        if (CompareType(val, 'array'))
        {
            let dep = deps[key] = {
                keys: [],
                count: 0
            };

            let last = val.length - 1;
            for (let i = 0; i < last; ++i)
            {
                let dname = val[i];

                let bed = beds[dname];
                if (!bed)
                {
                    bed = beds[dname] = [];
                }

                bed.push(key);

                dep.keys.push(dname);
                ++dep.count;
            }

            func = val[last];
        }
        else
        {
            first.push(key);
            func = val;
        }

        dict[key] = {
            function: func
        };
    }

    let count = 0;
    for (let i = 0, l = first.length; i < l; ++i)
    {
        CallInstance(first[i]);
    }

    function CallInstance(name, rlts)
    {
        ++count;

        let called = 0;
        let ins = dict[name];

        let cb = ((err, dat) =>
        {
            if (called || !(called = 1))
            {
                throw new Error('Duplicate call.');
            }

            if (err)
            {
                !terr && (terr = err);
            }
            else if (!terr)
            {
                ins.value = dat;

                let bed = beds[name];
                if (bed)
                {
                    for (let i = 0, l = bed.length; i < l; ++i)
                    {
                        ((name) =>
                        {
                            let dep = deps[name];
                            --dep.count;

                            if (!dep.count)
                            {
                                let rlts = {};
                                for (let i = 0, l = dep.keys.length; i < l; ++i)
                                {
                                    let k = dep.keys[i];
                                    rlts[k] = dict[k].value;
                                }

                                CallInstance(name, rlts);
                            }
                        })(bed[i]);
                    }
                }
            }

            --count;
            CheckCallback();
        });

        let argv = [];
        rlts && argv.push(rlts);
        argv.push(cb);

        setImmediate(() =>
        {
            ins.function.apply(null, argv);
        });
    }

    function CheckCallback()
    {
        if (count)
        {
            return;
        }

        setImmediate(() =>
        {
            if (!cb)
            {
                return;
            }

            if (terr)
            {
                return cb(terr);
            }

            let rlts = {};
            for (let k in dict)
            {
                if (!dict.hasOwnProperty(k))
                {
                    continue;
                }

                rlts[k] = dict[k].value;
            }

            cb(null, rlts);
        });
    }
};

instc.eachLimit = (coll, limit, iter, cb) =>
{
    let terr = null;

    let len = coll.length;
    let index = 0;
    let rtc = 0;

    let max = len > limit ? limit : len;
    for (let i = 0; i < max; ++i)
    {
        CallInstance(coll[index++]);
    }

    function CallInstance(ins)
    {
        ++rtc;

        let called = 0;

        let cb = ((err) =>
        {
            if (called || !(called = 1))
            {
                throw new Error('Duplicate call.');
            }

            if (err)
            {
                !terr && (terr = err);
            }
            else if (!terr)
            {
                index < len && CallInstance(coll[index++]);
            }

            --rtc;
            CheckCallback();
        });

        setImmediate(() =>
        {
            iter(ins, cb);
        });
    }

    function CheckCallback()
    {
        if (rtc)
        {
            return;
        }

        setImmediate(() =>
        {
            if (!cb)
            {
                return;
            }

            if (terr)
            {
                return cb(terr);
            }

            cb();
        });
    }
};

export default instc;
