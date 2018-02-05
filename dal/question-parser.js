const async = require('../includes/workflow');
const question = require('../dal/question.dal');

const ParseUInt = (row, index) =>
{
    let value = 0;

    if (index < 0 || index >= row.length)
    {
        return value;
    }

    const str = row[index];
    if (str)
    {
        const number = parseInt(str);
        if (!isNaN(number) && number >= 0)
        {
            value = number;
        }
    }

    return value;
};

const FillSubject = (row, subjects, sindex, kindex, value) =>
{
    const sub = row[sindex];
    if (sub)
    {
        const subject = subjects[sub];
        if (subject)
        {
            value.subject = subject._id;

            const kndges = row[kindex];
            if (kndges)
            {
                const ksarr = kndges.split(',');
                if (ksarr && ksarr.length)
                {
                    const kndgeArr = [];
                    ksarr.forEach(key =>
                    {
                        if (key)
                        {
                            const ins = subject.knowledges[key];
                            ins && kndgeArr.push(ins._id);
                        }
                    });

                    if (kndgeArr.length)
                    {
                        value.knowledges = kndgeArr;
                    }
                }
            }
        }
    }
};

const ROW_PARSER = [
    (row, subjects) =>
    {
        if (row.length < 13)
        {
            return null;
        }

        const value = {};

        const name = row[1];
        if (!name)
        {
            return null;
        }

        value.name = name;

        FillSubject(row, subjects, 2, 3, value);

        const content = {};

        const options = [];
        for (let i = 0; i < 6; ++i)
        {
            let opt = row[i + 4];
            if (!opt || !(opt = opt.trim()))
            {
                break;
            }

            options.push({ title: opt });
        }
        const right = row[10];
        if (right)
        {
            const code = right.charCodeAt();
            if (!isNaN(code))
            {
                const index = code - 65;
                if (index >= 0 && index < options.length)
                {
                    options[index].right = 1;

                    content.right = index;
                }
            }
        }

        content.options = options;

        const weight = ParseUInt(row, 11);
        value.weight = weight > 5 ? 5 : weight;

        const score = ParseUInt(row, 12);
        value.score = score === 0 ? 1 : score;

        value.content = content;

        return value;
    },
    (row, subjects) =>
    {
        if (row.length < 8)
        {
            return null;
        }

        const value = {};

        const name = row[1];
        if (!name)
        {
            return null;
        }

        value.name = name;

        FillSubject(row, subjects, 2, 3, value);

        const weight = ParseUInt(row, 4);
        value.weight = weight > 5 ? 5 : weight;

        const score = ParseUInt(row, 5);
        value.score = score === 0 ? 1 : score;

        const content = {};

        const text = row[6];
        if (!text)
        {
            return null;
        }

        content.text = text;

        content.count = ParseUInt(row, 7);

        const answers = [];
        let index = 8;
        while (index)
        {
            if (index >= row.length)
            {
                break;
            }

            const ans = row[index];
            if (!ans)
            {
                break;
            }

            answers.push(ans);
            ++index;
        }

        content.answers = answers;

        value.content = content;

        return value;
    }
];

const Loop = (arr, level, cb) =>
{
    if (!arr || !arr.length)
    {
        return;
    }

    arr.forEach(ins =>
    {
        cb(ins, level);
        Loop(ins.children, level + 1, cb);
    });
};

module.exports = {
    ParseSheets: (sheets, cb) =>
    {
        async.auto({
            categories: cb => question.GetCategories(cb)
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            const { categories: cat } = dat;

            const dict = {};
            cat.forEach(ins =>
            {
                ins.children = [];
                dict[ins._id.toHexString()] = ins;
            });

            const subjects = {};
            Object.keys(dict).forEach(key =>
            {
                const ins = dict[key];
                ins.parent ? dict[ins.parent].children.push(ins) : (subjects[ins.name] = ins);
            });

            Object.keys(subjects).forEach(key =>
            {
                const ins = subjects[key];
                const knlges = {};
                Loop(ins.children, 1, (child, level) =>
                {
                    if (level >= 2)
                    {
                        knlges[child.name] = child
                    }
                });
                ins.knowledges = knlges;
            });

            const qusArr = [];
            sheets.forEach(sheet =>
            {
                sheet.data.forEach(row =>
                {
                    if (!row || !row.length)
                    {
                        return true;
                    }

                    let qtype = 0;
                    switch (row[0])
                    {
                        case '单选':
                            qtype = 0;
                            break;
                        case '填空':
                            qtype = 1;
                            break;
                        default:
                            return true;
                    }

                    const value = ROW_PARSER[qtype](row, subjects);
                    if (value)
                    {
                        value.qtype = qtype;
                        qusArr.push(value);
                    }
                });
            });

            if (!qusArr.length)
            {
                return cb();
            }

            question.SaveMany(qusArr, cb);
        });
    }
};
