const mongodb = require('mongodb');
const settings = require('../settings');
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
        if (!cb)
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
        module.exports.GetCollection(coll, (err, coll, cb) =>
        {
            const opr = {};
            set && (opr['$set'] = set);
            unset && (opr['$unset'] = unset);

            coll.updateOne(filter || {}, opr, { upsert: !!upsert }, (err) =>
            {
                if (err)
                {
                    return cb(err);
                }

                cb();
            })
        }, cb);
    },
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

                    cb(vaild ? null : 'ObjectID invalid.');
                }
            ], cb);
        };
    }
};
