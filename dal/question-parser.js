const async = require('../includes/workflow');
const category = require('../dal/category.dal');
const questionDAL = require('../dal/question.dal');
const paperDAL = require('../dal/paper.dal');

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

const FillCategory = (row, subjectIndex, sectionIndex, knowledgeIndex, value) =>
{
    const { cache } = value;

    const sub = row[subjectIndex];
    if (sub)
    {
        cache.subject = sub;

        const sec = row[sectionIndex];
        if (sec)
        {
            cache.section = sec;

            const kno = row[knowledgeIndex];
            if (kno)
            {
                cache.knowledges = kno.split(/[,，]/g);
            }
        }
    }
};

const CreateCategory = (qus, nameDict, cb) =>
{
    const { cache } = qus;
    let parent = null;

    async.auto({
        subject: (cb) =>
        {
            if (!cache.subject)
            {
                return cb('Pass');
            }

            let ins = nameDict[cache.subject];
            if (ins)
            {
                qus.subject = ins._id;
                parent = ins._id;
                return cb(null, ins.child_dict);
            }

            questionDAL.AddCategory(cache.subject, parent, (err, dat) =>
            {
                if (err)
                {
                    return cb(err);
                }

                nameDict[cache.subject] = ins = {
                    _id: dat,
                    name: cache.subject,
                    parent: parent,
                    child_dict: {}
                };

                qus.subject = dat;
                parent = dat;
                cb(null, ins.child_dict);
            });
        },
        section: [
            'subject',
            ({ subject: secDict }, cb) =>
            {
                if (!cache.section)
                {
                    return cb('Pass');
                }

                let ins = secDict[cache.section];
                if (ins)
                {
                    parent = ins._id;
                    return cb(null, ins.child_dict);
                }

                questionDAL.AddCategory(cache.section, parent, (err, dat) =>
                {
                    if (err)
                    {
                        return cb(err);
                    }

                    secDict[cache.section] = ins = {
                        _id: dat,
                        name: cache.section,
                        parent: parent,
                        child_dict: {}
                    };

                    parent = dat;
                    cb(null, ins.child_dict);
                });
            }
        ],
        knowledges: [
            'section',
            ({ section: knoDict }, cb) =>
            {
                if (!cache.knowledges)
                {
                    return cb();
                }

                qus.knowledges = [];

                async.eachLimit(cache.knowledges, 1, (kno, cb) =>
                {
                    let ins = knoDict[kno];
                    if (ins)
                    {
                        qus.knowledges.push(ins._id);
                        return cb();
                    }

                    questionDAL.AddCategory(kno, parent, (err, dat) =>
                    {
                        if (err)
                        {
                            return cb(err);
                        }

                        knoDict[kno] = ins = {
                            _id: dat,
                            name: kno,
                            parent: parent,
                            child_dict: {}
                        };

                        qus.knowledges.push(ins._id);
                        cb();
                    });
                }, cb);
            }
        ]
    }, () => cb());
};

const CreateArticle = (qus, cb) =>
{
    const { cache } = qus;
    const { article, ap } = cache;
    if (!article)
    {
        return cb();
    }

    questionDAL.QueryArticle(article, (err, dat) =>
    {
        if (!err && dat)
        {
            qus.article = dat._id;
            return cb();
        }

        questionDAL.SaveArticle(article, ap, 1, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            qus.article = dat;
            cb();
        });
    });
};

const CreateQuestion = (qus, cb) =>
{
    const func = [
        (cb) => questionDAL.QueryRadio(qus.name, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            if (dat.content.options.length < qus.content.options.length)
            {
                qus._id = dat._id;
                return cb('Out of date.');
            }

            cb(null, dat);
        }),
        (cb) => questionDAL.QueryBlank(qus.name, qus.content.text, cb)
    ];

    const ins = func[qus.qtype];
    ins((err, dat) =>
    {
        if (!err && dat)
        {
            qus._id = dat._id;
        }

        questionDAL.SaveSingle(qus, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            cb(null, {
                _id: qus._id || dat,
                score: qus.score
            });
        });
    });
};

const ROW_PARSER = [
    (row, value) =>
    {
        if (row.length < 16)
        {
            return 1;
        }

        const { cache, contact } = value;

        const subjectIndex = 1;
        const articleIndex = 2;
        const nameIndex = 3;
        const optionIndex = 4;
        const answerIndex = 10;
        const explainIndex = 11;
        const sectionIndex = 12;
        const knowledgeIndex = 13;
        const weightIndex = 14;
        const scoreIndex = 15;
        const disorderIndex = 16;
        const apIndex = 17;

        const name = row[nameIndex];
        if (!name)
        {
            return 1;
        }

        value.name = name;

        FillCategory(row, subjectIndex, sectionIndex, knowledgeIndex, value);

        const content = {};

        const options = [];
        for (let i = 0; i < 6; ++i)
        {
            let opt = row[optionIndex + i];
            if (opt)
            {
                opt = opt.toString().trim();
                if (opt)
                {
                    options.push({ title: opt });
                }
            }
        }
        const right = row[answerIndex];
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

        const weight = ParseUInt(row, weightIndex);
        value.weight = weight > 5 ? 5 : weight;

        const score = ParseUInt(row, scoreIndex);
        value.score = score === 0 ? 1 : score;

        content.disorder = row[disorderIndex] !== '否' ? 1 : 0;

        value.content = content;

        value.explain = row[explainIndex];

        const article = row.length > articleIndex ? row[articleIndex] : null;
        const aup = !article;
        cache.article = aup ? contact.article : article;
        if (!aup)
        {
            contact.article = article;
        }

        const ap = row.length > apIndex ? row[apIndex] : null;
        const apup = !ap;
        cache.ap = apup ? contact.ap : ap;
        if (!apup)
        {
            contact.ap = ap;
        }

        return 0;
    },
    (row, value) =>
    {
        if (row.length < 10)
        {
            return 1;
        }

        let ci = 1;

        const { cache, contact } = value;

        const name = row[ci++];
        if (!name)
        {
            return 1;
        }

        value.name = name;

        FillCategory(row, ci++, ci++, ci++, value);

        const weight = ParseUInt(row, ci++);
        value.weight = weight > 5 ? 5 : weight;

        const score = ParseUInt(row, ci++);
        value.score = score === 0 ? 1 : score;

        const content = {};

        const text = row[ci++];
        if (!text)
        {
            return 1;
        }

        content.text = text;

        content.count = ParseUInt(row, ci++);

        const answers = [];
        for (let i = 0; i < content.count; ++i)
        {
            const idx = ci++;
            if (row.length <= idx)
            {
                return 1;
            }

            const ans = row[idx];
            if (!ans)
            {
                return 1;
            }

            answers.push(ans);
        }

        content.answers = answers;

        value.content = content;

        const pictureIndex = ci++;
        if (row.length > pictureIndex)
        {
            const v = row[pictureIndex];
            if (v)
            {
                value.picture = v;
                value.external = 1;
            }
        }

        const explainIndex = ci++;
        if (row.length > explainIndex)
        {
            const v = row[explainIndex];
            if (v)
            {
                value.explain = v;
            }
        }

        const articleIndex = ci++;
        if (row.length > articleIndex)
        {
            const v = row[articleIndex];
            if (v)
            {
                const up = v === '同上';
                cache.article = up ? contact.article : v;
                if (!up)
                {
                    contact.article = v;
                }
            }
        }

        const apIndex = ci++;
        if (row.length > apIndex)
        {
            const v = row[apIndex];
            if (v)
            {
                const up = v === '同上';
                cache.ap = up ? contact.ap : v;
                if (!up)
                {
                    contact.ap = v;
                }
            }
        }

        return 0;
    }
];

module.exports = {
    ParseSheets: (sheets, cb) =>
    {
        async.auto({
            categories: cb => questionDAL.GetCategories(cb),
            paper_cat: cb => paperDAL.GetCategories(cb)
        }, (err, dat) =>
        {
            if (err)
            {
                return cb(err);
            }

            const { categories: cat, paper_cat } = dat;

            const tree = category.CreateTree(cat);
            const nameDict = category.CreateNameDict(tree);

            const paperTree = category.CreateTree(paper_cat);
            const paperCatDict = category.CreateNameDict(paperTree);

            async.eachSeries(sheets, (sheet, cb) =>
            {
                const qusArr = [];
                const ext = {};

                const contact = {};
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

                    const value = {
                        cache: {},
                        contact
                    };
                    if (!ROW_PARSER[qtype](row, value, ext))
                    {
                        value.qtype = qtype;
                        qusArr.push(value);

                        const { cache } = value;
                        if (!ext.subject && cache.subject)
                        {
                            ext.subject = cache.subject;
                            if (!ext.section && cache.section)
                            {
                                ext.section = cache.section;
                                if (!ext.knowledge && cache.knowledges && cache.knowledges.length)
                                {
                                    ext.knowledge = cache.knowledges[0];
                                }
                            }
                        }
                    }
                });

                async.auto({
                    category: (cb) =>
                    {
                        async.eachSeries(qusArr, (ins, cb) => CreateCategory(ins, nameDict, cb), cb);
                    },
                    article: (cb) =>
                    {
                        async.eachSeries(qusArr, (ins, cb) => CreateArticle(ins, cb), cb);
                    },
                    question: [
                        'category',
                        'article',
                        (dat, cb) =>
                        {
                            async.mapSeries(qusArr, (ins, cb) =>
                            {
                                delete ins.cache;
                                CreateQuestion(ins, cb);
                            }, cb);
                        }
                    ],
                    paper_cat: (cb) =>
                    {
                        paperDAL.CreateCategory(ext, paperCatDict, cb);
                    },
                    paper: [
                        'question',
                        'paper_cat',
                        ({ question, paper_cat }, cb) =>
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
                                category: paper_cat,
                                score: score,
                                questions: qusArr,
                                duration: 0
                            }, cb);
                        }
                    ]
                }, cb);
            }, cb);
        });
    }
};
