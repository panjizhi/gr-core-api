const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const request = require('superagent');
const { COLLS } = require('../includes/decl');
const utils = require('../includes/utils');
const async = require('../includes/workflow');
const ftt = require('../includes/FullTimeTask');
const mongo = require('../drivers/mongodb');
const settings = require('../settings');

const __stoStgs = settings.storage;

function Download(src, cb)
{
    let u = null;
    try
    {
        u = new URL(src);
    }
    catch (e)
    {
        return cb(null, src);
    }

    if (u.host === __stoStgs.host)
    {
        return cb(null, src);
    }

    request.head(src, (err, res) =>
    {
        if (err)
        {
            return cb(err);
        }

        const name = utils.CreateRandomBytesBit() + '.' + res.type.substr(res.type.indexOf('/') + 1);
        const p = path.resolve(__stoStgs.local, 'picture', name);
        const outst = fs.createWriteStream(p);

        const url = utils.GetURLPrefix(__stoStgs) + '/picture/' + name;

        outst.on('error', (err) => cb(err));
        outst.on('finish', () => cb(null, url));

        request.get(src).pipe(outst);
    });
}

ftt.Start(0, 10, (cb) =>
{
    async.auto({
        question: (cb) =>
        {
            async.auto({
                query: (cb) =>
                {
                    mongo.FindMany(COLLS.QUESTION, { external: 1 }, {
                        projection: {
                            _id: 1,
                            picture: 1
                        }
                    }, cb);
                },
                exec: [
                    'query',
                    ({ query }, cb) =>
                    {
                        if (!query.length)
                        {
                            return cb('Not found');
                        }

                        async.eachLimit(query, 10, (ins, cb) =>
                        {
                            async.auto({
                                download: (cb) =>
                                {
                                    Download(ins.picture, cb);
                                },
                                exec: [
                                    'download',
                                    ({ download }, cb) =>
                                    {
                                        mongo.UpdateOne(COLLS.QUESTION, { _id: ins._id }, { picture: download }, { external: 1 }, 0, cb);
                                    }
                                ]
                            }, () => cb());
                        }, () => cb());
                    }
                ]
            }, () => cb());
        },
        article: (cb) =>
        {
            async.auto({
                query: (cb) =>
                {
                    mongo.FindMany(COLLS.ARTICLE, { external: 1 }, {
                        projection: {
                            _id: 1,
                            picture: 1
                        }
                    }, cb);
                },
                exec: [
                    'query',
                    ({ query }, cb) =>
                    {
                        if (!query.length)
                        {
                            return cb('Not found');
                        }

                        async.eachLimit(query, 10, (ins, cb) =>
                        {
                            async.auto({
                                download: (cb) =>
                                {
                                    Download(ins.picture, cb);
                                },
                                exec: [
                                    'download',
                                    ({ download }, cb) =>
                                    {
                                        mongo.UpdateOne(COLLS.ARTICLE, { _id: ins._id }, { picture: download }, { external: 1 }, 0, cb);
                                    }
                                ]
                            }, () => cb());
                        }, () => cb());
                    }
                ]
            }, () => cb());
        }
    }, (err) => err ? ftt.ReturnFree(cb) : ftt.ReturnBusy(cb));
});
