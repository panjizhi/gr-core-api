const mongodb = require('mongodb');
const settings = require('../settings');
const common = require('../includes/common');
const utils = require('../includes/utils');
const async = require('../includes/workflow');

const client = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;

let __db = null;

const __mstgs = settings.database.mongodb;

const url = 'mongodb://' + __mstgs.host + ':' + __mstgs.port;
client.connect(url, (err, client) =>
{
    if (err)
    {
        console.log(err);
        return;
    }

    __db = client.db(__mstgs.database);
});

module.exports = {
    CreateObjectID: (str) =>
    {
        try
        {
            return ObjectID.createFromHexString(str);
        }
        catch (ex)
        {
            return null;
        }
    },
    CreateObjectIDArr: (ids) =>
    {
        const _ids = [];
        ids.forEach(ins =>
        {
            const _id = module.exports.CreateObjectID(ins);
            _id && _ids.push(_id);
        });

        return _ids;
    },
    GetConnection: (cb) =>
    {
        (function GetConn()
        {
            if (!__db)
            {
                return setTimeout(GetConn, 100);
            }

            cb(null, __db);
        })();
    },
    GetCollection: (coll, get, cb) =>
    {
        module.exports.GetConnection((err, db) =>
        {
            db.collection(coll, (err, coll) =>
            {
                if (err)
                {
                    return cb(err);
                }

                get(null, coll, (...argv) => cb.apply(null, argv));
            });
        });
    },
    CallPagingModel: (coll, filter, sort, start, count, cb) =>
    {
        if (!filter)
        {
            filter = {};
        }

        module.exports.GetCollection(coll, (err, coll, cb) =>
        {
            async.auto({
                total: (cb) =>
                {
                    coll.count(filter, cb);
                },
                records: (cb) =>
                {
                    coll.find(filter, {
                        skip: start,
                        limit: count,
                        sort: sort
                    }).toArray(cb);
                }
            }, (err, dat) =>
            {
                if (err)
                {
                    return cb(err);
                }

                cb(null, dat);
            });
        }, cb);
    },
    FindOne: (coll, query, options, cb) =>
    {
        if (!cb && typeof options === 'function')
        {
            cb = options;
            options = null;
        }

        module.exports.GetCollection(coll, (err, coll, cb) =>
        {
            coll.findOne(query, options, (err, dat) =>
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
    },
    FindMany: (coll, query, options, cb) =>
    {
        if (!cb)
        {
            cb = options;
            options = null;
        }

        module.exports.GetCollection(coll, (err, coll, cb) =>
        {
            coll.find(query, options).toArray(cb);
        }, cb);
    },
    Distinct: (coll, key, query, cb) =>
    {
        module.exports.GetCollection(coll, (err, coll, cb) =>
        {
            coll.distinct(key, query || {}, cb);
        }, cb);
    },
    InsertOne: (coll, doc, cb) =>
    {
        module.exports.GetCollection(coll, (err, coll, cb) =>
        {
            coll.insertOne(doc, (err, dat) =>
            {
                if (err)
                {
                    return cb(err);
                }

                cb(null, dat.insertedId);
            })
        }, cb);
    },
    UpdateOne: (coll, filter, set, unset, upsert, cb) =>
    {
        const update = {};
        set && (update['$set'] = set);
        unset && (update['$unset'] = unset);
        module.exports.UpdateSingle(coll, filter, update, { upsert: !!upsert }, cb);
    },
    UpdateSingle: (coll, filter, update, options, cb) =>
    {
        if (!cb && typeof options === 'function')
        {
            cb = options;
            options = null;
        }

        if (!options)
        {
            options = {};
        }
        if (typeof options.upsert === 'undefined')
        {
            options.upsert = false;
        }

        module.exports.GetCollection(coll, (err, coll, cb) => coll.updateOne(filter, update, options, cb), (err) =>
        {
            err ? cb(err) : cb();
        });
    },
    UpdateMany: (coll, filter, update, cb) =>
    {
        module.exports.GetCollection(coll, (err, coll, cb) => coll.updateMany(filter || {}, update, cb), cb);
    },
    Remove: (coll, filter, cb) => module.exports.GetCollection(coll, (err, coll, cb) => coll.remove(filter, cb), cb),
    CheckObjectID: (...names) =>
    {
        const fields = {};
        names.forEach(ins => fields[ins] = {
            type: 'string',
            null: 1
        });

        return (req, cb) =>
        {
            utils.CallRequestIterate(req, [
                utils.CheckServiceStruct({
                    type: 'object',
                    fields: fields
                }),
                (req, cb) =>
                {
                    const params = req.body;
                    const vaild = names.every(ins =>
                    {
                        const val = params[ins];
                        if (!val)
                        {
                            return true;
                        }

                        const _val = module.exports.CreateObjectID(val);
                        if (!_val)
                        {
                            return false;
                        }

                        params['_' + ins] = _val;
                        return true;
                    });

                    cb(vaild ? 0 : 1);
                }
            ], cb);
        };
    },
    ConvertInput: (contrast) =>
    {
        return (req, cb) =>
        {
            const { body } = req;
            cb(module.exports.Convert(body, contrast));
        };
    },
    Convert: (struct, contrast) =>
    {
        function DirectCheck(struct)
        {
            for (const key in contrast)
            {
                if (!contrast.hasOwnProperty(key))
                {
                    continue;
                }

                const cval = contrast[key];
                const value = struct[key];
                if (common.CompareType(cval, 'object'))
                {
                    return module.exports.Convert(value, cval);
                }

                if (!cval)
                {
                    continue;
                }

                const vtype = common.GetType(value);
                switch (vtype)
                {
                    case 'undefined':
                    case 'null':
                        continue;
                    case 'string':
                    {
                        const oid = module.exports.CreateObjectID(value);
                        if (!oid)
                        {
                            return 1;
                        }

                        struct[key] = oid;
                        break;
                    }
                    case 'array':
                    {
                        for (let i = 0, l = value.length; i < l; ++i)
                        {
                            const oid = module.exports.CreateObjectID(value[i]);
                            if (!oid)
                            {
                                return 1;
                            }

                            value[i] = oid;
                        }

                        break;
                    }
                    default:
                        return 1;
                }
            }

            return 0;
        }

        const stype = common.GetType(struct);
        switch (stype)
        {
            case 'object':
            {
                if (DirectCheck(struct))
                {
                    return 1;
                }

                break;
            }
            case 'array':
            {
                for (let i = 0, l = struct.length; i < l; ++i)
                {
                    if (DirectCheck(struct[i]))
                    {
                        return 1;
                    }
                }

                break;
            }
            default:
                return 1;
        }

        return 0;
    }
};
