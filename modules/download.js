const stream = require('stream');
const moment = require('moment');
const express = require('express');
const excel = require('node-xlsx');
const officegen = require('officegen');
const common = require('../includes/common');
const async = require('../includes/workflow');
const utils = require('../includes/utils');
const login = require('../includes/login');
const mongo = require('../drivers/mongodb');
const candidateDAL = require('../dal/candidate.dal');
const resultDAL = require('../dal/result.dal');

const DIRECT_HTTP_STATUS = [400];

const router = express.Router();

//router.use(login.ExpressCheck());

const func = {
    'wrong-questions': [
        utils.CheckObjectFields({ id: 'string' }, 1),
        mongo.CheckObjectID('id'),
        (req, cb) =>
        {
            const { _id } = req.body;
            async.auto({
                candidate: (cb) =>
                {
                    candidateDAL.GetSingle(_id, cb);
                },
                questions: (cb) =>
                {
                    resultDAL.GetWrongQuestions(_id, cb);
                }
            }, (err, dat) =>
            {
                if (err)
                {
                    return cb(1, err);
                }

                const { candidate, questions } = dat;

                const sheet = [];
                sheet.push([
                    '时间',
                    '类型',
                    '名称',
                    '学科',
                    '知识点',
                    '难度系数',
                    '回答',
                    '正确答案'
                ]);

                questions.forEach(ins =>
                {
                    const { question: qus, answer, time } = ins;

                    const row = [
                        time ? moment.unix(time).format('YYYY-MM-DD HH:mm:ss') : '较早之前',
                        [
                            '单选',
                            '填空',
                            '计算',
                            '写作'
                        ][qus.qtype],
                        qus.name,
                        qus.subject ? qus.subject.name : null,
                        qus.knowledges && qus.knowledges.length ? qus.knowledges.map(ins => ins.name).join(',') : null,
                        qus.weight
                    ];

                    [
                        () =>
                        {
                            row.push(qus.content.options[answer].title);
                            row.push(qus.content.options[qus.content.right].title);
                        },
                        () =>
                        {
                            row.push(answer.join(','));
                            row.push(qus.content.answers.join(','));
                        }
                    ][qus.qtype]();

                    sheet.push(row);
                });


                const buffer = excel.build([{ name: '错题', data: sheet }]);

                cb(0, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', `${candidate.name}错题集合.xlsx`, buffer);
            });
        }
    ],
    result: [
        utils.CheckObjectFields({ id: 'string' }, 1),
        mongo.CheckObjectID('id'),
        (req, cb) =>
        {
            const { _id } = req.body;
            async.auto({
                result: (cb) =>
                {
                    resultDAL.GetSingle(_id, cb);
                },
                candidate: [
                    'result',
                    ({ result }, cb) =>
                    {
                        candidateDAL.GetSingle(result.author, cb);
                    }
                ]
            }, (err, dat) =>
            {
                if (err)
                {
                    return cb(1, err);
                }

                const { result: { paper, answers, created_time, duration, score }, candidate } = dat;

                const docx = officegen('docx');

                docx.on('error', (err) =>
                {
                    cb(1, err);
                });

                const qdict = {};
                paper.questions.forEach(ins => qdict[ins._id.toHexString()] = ins);

                const pname = docx.createP({ align: 'center' });
                pname.addText(paper.name, {
                    bold: true,
                    font_size: 30
                });

                const time = docx.createP();
                time.addText(`考试时间 ${created_time ? moment.unix(created_time).format('YYYY-MM-DD HH:mm:ss') : '较早之前'}`);

                const dur = docx.createP();
                dur.addText(`考试时长 ${duration ? moment.unix(duration + moment('2000-01-01 00:00:00').unix()).format('HH:mm:ss') : '无'}`);

                const fsc = docx.createP();
                fsc.addText(`满分 ${paper.score}`);

                const sco = docx.createP();
                sco.addText(`得分 ${score}`);

                docx.createP();

                answers.forEach((ins, i) =>
                {
                    const qus = qdict[ins.question.toHexString()];

                    const title = docx.createP();
                    title.addText(`${i + 1}. ${qus.name}`, {
                        bold: true,
                        font_size: 14
                    });

                    const { content } = qus;
                    [
                        () =>
                        {
                            content.options.forEach((ins, i) =>
                            {
                                const opt = docx.createP();
                                opt.addText(String.fromCharCode(65 + i) + ':  ');
                                opt.addText(ins.title);
                            });

                            const ans = docx.createP();
                            ans.addText('回答 ', { color: '8c8c8c' });
                            ans.addText(String.fromCharCode(65 + ins.answer));
                            ans.addText(`   ${ins.right ? '正确' : '错误'}`, {
                                color: ins.right ? '52c41a' : 'f5222d',
                                bold: !ins.right
                            });
                            !ins.right && ans.addText(`   正确答案 ${String.fromCharCode(65 + content.right)}`);
                        },
                        () =>
                        {
                            const ttl = docx.createP();
                            ttl.addText(content.text);

                            content.answers.forEach((ans, i) =>
                            {
                                const val = ins.answer ? ins.answer[i] : '';

                                const opt = docx.createP();
                                opt.addText(`${i + 1}:  `);
                                opt.addText(val);

                                const right = ans === val;
                                opt.addText(`   ${right ? '正确' : '错误'}`, {
                                    color: right ? '52c41a' : 'f5222d',
                                    bold: !right
                                });
                                !right && opt.addText(`   正确答案 ${ans}`);
                            });
                        }
                    ][qus.qtype]();

                    docx.createP();
                });

                cb(0, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', `${candidate.name}${paper.name}答卷.docx`, (res) =>
                {
                    docx.generate(res);
                });
            });
        }
    ]
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
    const funcArr = common.CompareType(val, 'array') ? val : [val];
    router.get(`/${key}`, (req, res) =>
    {
        utils.CallRequestIterate(req, funcArr, (hstat, type, name, buffer) =>
        {
            if (hstat)
            {
                return res.status(hstat in dsdict ? hstat : 500).end();
            }

            res.set({
                'Content-Type': type,
                'Content-Disposition': `attachment;filename*=${encodeURIComponent(name)}`,
                'Expires': 0,
                'Pragma': 'no-cache'
            });

            common.CompareType(buffer, 'function') ? buffer(res) : res.end(buffer);
        });
    });
}

module.exports = router;
