const _ = require('lodash');
const keystone = require('keystone');

const Student = keystone.list('Student');
const Dispatch = keystone.list('Dispatch');
const Paper = keystone.list('Paper');
const Result = keystone.list('Result');

/**
 * 待考试题列表: url => /api/exam/list/:openid
 *
 * @param openid {string} 微信用户唯一ID
 */
exports.list = function(req, res) {
  Student.model
  .findOne({
    openid: req.params.openid
  })
  .select('_id')
  .exec((err, stu) => {
    if ( err || !stu ) {
      return res.apiResponse([]);
    }

    Dispatch.model
    .find()
    .where({
      student: stu._id,
      isDone: false
    })
    .populate('paper', '_id name')
    .select('paper')
    .exec((err, papers) => {
      if ( err ) {
        return res.apiError('database error', err);
      }

      res.apiResponse(papers || []);
    });
  });
}

/**
 * 试题内容: url => /api/exam/detail/:id
 *
 * @param id {string} 考卷ID
 */
exports.detail = function(req, res) {
  Paper.model
  .findById(req.params.id)
  .populate('questions', ['_id', 'name', 'type', 'options'].join(' '))
  .exec((err, paper) => {
    if (err) {
      return res.apiError('database error', err);
    }

    res.apiResponse(paper || {});
  });
}

/**
 * 试题回顾: url => /api/exam/review/:id
 *
 * @param id {string} 考卷ID
 */
exports.review = function(req, res) {
  Paper.model
  .findById(req.params.id)
  .populate('questions')
  .exec( (err, paper) => {
    if (err) {
      return res.apiError('database error', err);
    }

    res.apiResponse(paper || {});
  });
}

/**
 * 计算考试成绩: url => /api/exam/calculate
 *
 * @param examId  {string} 考卷 ID
 * @param answers {string} 考生答案
 * @param dispatchId {string} 考题分配关系 ID
 */
exports.calculate = function (req, res) {
  const form = req.body;
  const stuAnswers = form.answers; // 考生答案

  Paper.model
  .findById(form.examId)
  .populate('questions')
  .exec((err, paper) => {
    if (err) {
      return res.apiError('database error', err);
    }

    let vResults = { // 词汇量计算
      '1': {
        vocabulary: 100,
        total: 0,
        correct: 0
      },        
      '2': {
        vocabulary: 300,
        total: 0,
        correct: 0
      },
      '3': {
        vocabulary: 500,
        total: 0,
        correct: 0
      },
      '4': {
        vocabulary: 600,
        total: 0,
        correct: 0
      },
      '5': {
        vocabulary: 800,
        total: 0,
        correct: 0
      },
      '6': {
        vocabulary: 900,
        total: 0,
        correct: 0
      }
    };

    let vocabulary = 0; // 统计词汇量
    let score = 0; // 统计得分
    let errorAnswers = []; // 错题列表

    _.forEach(paper.questions, (question, index) => {
      let key = '' + question.weight;
      vResults[key].total += 1; // 统计相同 `weight` 题目数

      let stuAnswer = stuAnswers[question._id];

      if ( question.answer === stuAnswer.answer ) {
        score += question.score; // 统计成绩
        vResults[key].correct += 1; // 统计相同 `weight` 正确答题数
      } else {
        errorAnswers.push(_.cloneDeep(stuAnswer));
      }           
    });

    vocabulary = _.reduce(vResults, (result, item, key) => {
      if ( item.total > 0 ) {
        result += item.vocabulary * item.correct / item.total;
      }

      return result;
    }, 0);
    vocabulary = Math.ceil(vocabulary); // 词汇量上取整

    Dispatch.model.findById(form.dispatchId, (err, item) => {
      if ( err ) {
        return res.apiError('database error', err);
      }

      item.isDone = true; // 设置 `已完成` 标记
      item.save((err, updatedItem) => {
        if ( err ) {
          return res.apiError('database error', err);
        }

        new Result.model({
          score: score,
          vocabulary: vocabulary,
          author: form.userId,
          paper: form.examId,
          errJSON: JSON.stringify(errorAnswers)
        }).save((err, item) => {
          if ( err ) {
            return res.apiError('database error', err);
          }

          res.apiResponse({
            score: score,
            vocabulary: vocabulary
          });
        });
      });
    });
  });
}

/**
 * 已完成试题列表: url => /api/exam/accomplish/:openid
 *
 * @param openid {string} 微信用户唯一ID
 */
exports.accomplish = function(req, res) {
  Student.model
  .findOne({
    openid: req.params.openid
  })
  .select('_id')
  .exec((err, stu) => {
    if ( err || !stu ) {
      return res.apiResponse([]);
    }

    Result.model
    .find()
    .where({
      author: stu._id
    })
    .populate('paper', '_id name')
    .exec((err, papers) => {
      if ( err ) {
        return res.apiError('database error', err);
      }

      res.apiResponse(papers.reverse() || []);
    });
  });
}
