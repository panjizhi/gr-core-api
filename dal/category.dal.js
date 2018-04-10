const moment = require('moment');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');

module.exports = {
    LoopIDs: (coll, _id, cb) =>
    {
        let result = [_id];

        function Find(_ids, cb)
        {
            coll.find({
                parent: {
                    $in: _ids
                }
            }, {
                _id: 1
            }).toArray((err, dat) =>
            {
                if (err)
                {
                    return cb(err);
                }

                if (dat.length)
                {
                    const _pids = dat.map(ins => ins._id);
                    result = result.concat(_pids);

                    return Find(_pids, cb);
                }

                cb();
            });
        }

        Find([_id], (err) =>
        {
            if (err)
            {
                return cb(err);
            }

            cb(null, result);
        });
    },
    Add: (collName, name, _pid, cb) =>
    {
        async.auto({
            check: (cb) =>
            {
                if (!_pid)
                {
                    return cb();
                }

                mongodb.GetCollection(collName, (err, coll, cb) =>
                {
                    coll.findOne({
                        _id: _pid
                    }, (err, dat) =>
                    {
                        if (err)
                        {
                            return cb(err);
                        }

                        if (!dat)
                        {
                            return cb('Not found.');
                        }

                        cb(null, dat);
                    })
                }, cb);
            }
        }, (err) =>
        {
            if (err)
            {
                return cb(err);
            }

            const ntsmp = moment().unix();
            mongodb.InsertOne(collName, {
                name: name,
                parent: _pid,
                created_time: ntsmp,
                updated_time: ntsmp
            }, cb);
        });
    },
    Remove: (collName, _ids, cb) =>
    {
        mongodb.GetCollection(collName, (err, coll, cb) =>
        {
            coll.remove({
                _id: {
                    $in: _ids
                }
            }, cb);
        }, cb);
    },
    CreateTree: (value) =>
    {
        const dict = {};
        value.forEach(ins =>
        {
            ins.children = [];
            dict[ins._id.toHexString()] = ins;
        });

        const top = [];
        value.forEach(ins => (ins.parent ? dict[ins.parent.toHexString()].children : top).push(ins));

        return top;
    },
    CreateNameDict: (tree) =>
    {
        const top = {};
        tree && tree.length && tree.forEach(ins =>
        {
            top[ins.name] = ins;
            ins.child_dict = module.exports.CreateNameDict(ins.children);
        });

        return top;
    }
};
