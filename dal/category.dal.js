const moment = require('moment');
const common = require('../includes/common');
const async = require('../includes/workflow');
const mongodb = require('../drivers/mongodb');

module.exports = {
    LoopContent: (coll, _id, cb) =>
    {
        const root = common.CompareType(_id, 'array') ? _id : [_id];

        async.auto({
            detail: (cb) =>
            {
                mongodb.FindMany(coll, {
                    _id: { $in: root }
                }, {
                    sort: { updated_time: 1 }
                }, cb);
            },
            children: [
                'detail',
                ({ detail }, cb) =>
                {
                    let container = detail;
                    FindChildren(detail, cb);

                    function FindChildren(parents, cb)
                    {
                        mongodb.FindMany(coll, {
                            parent: { $in: parents.map(ins => ins._id) }
                        }, {
                            sort: { updated_time: 1 }
                        }, (err, dat) =>
                        {
                            if (err)
                            {
                                return cb(err);
                            }

                            if (dat && dat.length)
                            {
                                container = container.concat(dat);
                                return setImmediate(() => FindChildren(dat, cb));
                            }

                            cb(null, container);
                        });
                    }
                }
            ]
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            const { children } = dat;
            cb(null, children);
        });
    },
    LoopIDs: (coll, _id, cb) =>
    {
        module.exports.LoopContent(coll, _id, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            const _ids = dat.map(ins => ins._id);
            cb(null, _ids);
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
