const fs = require('fs');
const moment = require('moment');

const logDir = __dirname + '/../logs/';

module.exports = {
    Create: function (category)
    {
        category = category || 'default';

        const levels = [
            'trace',
            'debug',
            'info',
            'warn',
            'error',
            'fatal'
        ];

        const catDir = logDir + category;
        fs.mkdir(catDir, 0o777, (err) =>
        {
        });

        const instc = {};
        for (let k = 0, l = levels.length; k < l; ++k)
        {
            (function (flv)
            {
                instc[flv] = (location, content) =>
                {
                    if (!arguments.length)
                    {
                        return;
                    }

                    if (!content)
                    {
                        content = location;
                        location = 'default';
                    }

                    const m = moment(new Date());
                    const path = catDir + '/' + flv + '.' + m.format('YYYY-MM-DD_HH') + '.log';
                    const dat = [
                            m.format('YYYY-MM-DD HH:mm:ss.SSS'),
                            flv,
                            category,
                            location,
                            content
                        ].join(' | ') + '\r\n';
                    fs.appendFile(path, dat, function (err)
                    {
                    });
                }
            })(levels[k]);
        }

        return instc;
    }
};
