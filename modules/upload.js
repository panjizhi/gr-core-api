const express = require('express');
const path = require('path');
const formidable = require('formidable');
const excel = require('node-xlsx');
const async = require('../includes/workflow');
const fs = require('fs');
const cors = require('cors');
const settings = require('../settings');
const utils = require('../includes/utils');
const login = require('../includes/login');
const qusParser = require('../dal/question-parser');

const cdnStgs = settings.cdn;
const stoStgs = cdnStgs.storage;

const DIRECT_HTTP_STATUS = [413, 403];

const router = express.Router();

router.use(cors());

//router.use(login.ExpressCheck());

const func = {
    picture: (req, fields, files, cb) =>
    {
        const dir = path.resolve(stoStgs.local, 'picture');
        fs.mkdir(dir, () =>
        {
            let rlts = [];
            async.eachLimit(Object.keys(files), 10, (key, cb) =>
            {
                const ins = files[key];

                if (ins.size > 2 * 1024 * 1024)
                {
                    return cb(413);
                }

                const p = ins.path;

                let ext = null;
                switch (ins.type)
                {
                    case 'image/pjpeg':
                        ext = 'jpg';
                        break;
                    case 'image/jpeg':
                        ext = 'jpg';
                        break;
                    case 'image/png':
                        ext = 'png';
                        break;
                    case 'image/x-png':
                        ext = 'png';
                        break;
                    default:
                        return cb();
                }

                const name = utils.CreateRandomBytesBit() + '.' + ext;

                let ist = fs.createReadStream(p);
                let ost = fs.createWriteStream(path.join(dir, name));

                ist.on('error', () =>
                {
                    cb();
                });

                ist.pipe(ost);
                ist.on('end', () =>
                {
                    fs.unlink(p, () =>
                    {
                        rlts.push((cdnStgs.protocol || req.protocol) + '://' + cdnStgs.host + cdnStgs.path + stoStgs.path + '/picture/' + name);
                        cb();
                    });
                });
            }, (err) =>
            {
                if (err)
                {
                    return cb(err);
                }

                cb(rlts.length ? 0 : 1, rlts.length ? rlts : null);
            });
        });
    },
    question: (req, fields, files, cb) =>
    {
        async.eachLimit(Object.keys(files), 10, (key, cb) =>
        {
            const ins = files[key];
            let sheets = null;
            try
            {
                sheets = excel.parse(ins.path);
            }
            catch (ex)
            {
                return cb('Unsupported');
            }

            qusParser.ParseSheets(sheets, cb);
        }, (err) =>
        {
            cb(err ? 1 : 0);
        });
    }
};


const dsdict = {};
DIRECT_HTTP_STATUS.forEach(ins => dsdict[ins] = 1);

for (const key in func)
{
    if (!func.hasOwnProperty(key))
    {
        continue;
    }

    const val = func[key];
    router.post(`/${key}`, (req, res) =>
    {
        const form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) =>
        {
            if (err)
            {
                return End(1);
            }

            let called = 0;
            val(req, fields, files, (hstat, dat, msg) =>
            {
                if (called || !(called = 1))
                {
                    return;
                }

                End(hstat, dat, msg);
            });
        });

        function End(hstat, dat, msg)
        {
            if (hstat in dsdict)
            {
                return res.status(hstat).end();
            }

            res.json({
                status: hstat || 0,
                data: dat !== null ? dat : undefined,
                msg: msg !== null ? msg : undefined
            });
        }
    });
}

module.exports = router;
