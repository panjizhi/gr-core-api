const async = require('../includes/workflow');
const category = require('../dal/category.dal');
const questionDAL = require('../dal/question.dal');
const paperDAL = require('../dal/paper.dal');

const CreateQuestion = (qus, cb) =>
{
    const func = [
        (cb) => questionDAL.QueryRadio(qus.name, cb),
        (cb) => questionDAL.QueryBlank(qus.name, qus.content.text, cb)
    ];

    const ins = func[qus.qtype];
    ins((err, dat) =>
    {
        if (err || !dat)
        {
            return cb('Not found.');
        }

        cb(null, dat);
    });
};

const ROW_PARSER = [
    (row, value) =>
    {
        if (row.length < 2)
        {
            return 1;
        }

        let ci = 1;

        const name = row[ci++];
        if (!name)
        {
            return 1;
        }

        value.name = name;

        return 0;
    },
    (row, value) =>
    {
        if (row.length < 3)
        {
            return 1;
        }

        let ci = 1;

        const name = row[ci++];
        if (!name)
        {
            return 1;
        }

        value.name = name;

        const content = {};

        const text = row[ci++];
        if (!text)
        {
            return 1;
        }

        content.text = text;

        value.content = content;

        return 0;
    }
];

module.exports = {
    ParseSheets: (sheets, cb) =>
    {
        async.eachSeries(sheets, (sheet, cb) =>
        {
            const qusArr = [];
            const ext = {};

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
                    case '一级分类':
                        ext.subject = row[1];
                        return true;
                    case '二级分类':
                        ext.section = row[1];
                        return true;
                    case '三级分类':
                        ext.knowledge = row[1];
                        return true;
                    default:
                        return true;
                }

                const value = {};
                if (!ROW_PARSER[qtype](row, value))
                {
                    value.qtype = qtype;
                    qusArr.push(value);
                }
            });

            async.auto({
                question: (cb) =>
                {
                    const arr = [];
                    const dict = {};
                    async.eachSeries(qusArr, (ins, cb) => CreateQuestion(ins, (err, dat) =>
                    {
                        if (err)
                        {
                            return cb();
                        }

                        const key = dat._id.toHexString();
                        if (!dict[key])
                        {
                            dict[key] = 1;
                            arr.push(dat);
                        }

                        cb();
                    }), () => cb(null, arr));
                },
                categories: (cb) =>
                {
                    paperDAL.GetCategories(cb);
                },
                create: [
                    'categories',
                    ({ categories }, cb) =>
                    {
                        const tree = category.CreateTree(categories);
                        const dict = category.CreateNameDict(tree);
                        paperDAL.CreateCategory(ext, dict, cb);
                    }
                ],
                paper: [
                    'question',
                    'create',
                    ({ question, create }, cb) =>
                    {
                        if (!question.length)
                        {
                            return cb();
                        }

                        let score = 0;
                        const qusArr = [];
                        question.forEach(ins =>
                        {
                            score += ins.score;
                            qusArr.push(ins._id);
                        });

                        paperDAL.SaveSingle({
                            name: sheet.name,
                            category: create,
                            score: score,
                            questions: qusArr,
                            duration: 0
                        }, cb);
                    }
                ]
            }, cb);
        }, cb);
    }
};
