const keystone  = require('keystone');
const Excel     = require('exceljs');
const Question  = keystone.list('Question');
const Paper     = keystone.list('Paper');

const CHOICE_TYPE       = '单选';
const MULT_CHOICES_TYPE = '多选';
const CLOZE_TYPE        = '填空';
const TYPES_MAP         = {
  [CHOICE_TYPE]         : 'choice',
  [MULT_CHOICES_TYPE]   : 'multiple-choices',
  [CLOZE_TYPE]          : 'cloze'
};

exports = module.exports = function (req, res) {
  const view   = new keystone.View(req, res);
  const locals = res.locals;

  // Set locals
  locals.section   = 'upload_xlsx_paper';
  locals.submitted = false;

  // On POST requests, add the Enquiry item to the database
  view.on('post', { action: 'import' }, function (next) {
    xlsx2json(req.files.file.path).then(result => {
      Promise.all((result.questions || []).map(q => new Promise((resolve, reject) => {
        new Question.model({
          name: q.question,
          type: TYPES_MAP[q.type] || TYPES_MAP[CHOICE_TYPE],
          weight: q.weight,
          score: q.score,
          options: q.options || [],
          answer: q.answer
        }).save((err, item) => {
          if (err) reject(err);
          resolve(item);
        });
      }))).then(items => {
        locals.paper     = result.title;
        locals.count     = items.length;
        locals.submitted = true;

        new Paper.model({
          name: result.title,
          questions: items.map(item => item._id)
        }).save((err, ret) => {
          if (err) reject(err);
          next();
        })
      }, err => {
        locals.submitted = true;
        locals.error = JSON.stringify(err);

        next();
      });
    });
  });

  view.render('upload_xlsx_paper');
};

function xlsx2json(filename) {
  const result = {
    title: '',
    questions: []
  };

  return new Excel.Workbook().xlsx.readFile(filename).then(worksheets => {
    worksheets.eachSheet(worksheet => {
      worksheet.eachRow((row, rowNumber) => {
        if ( rowNumber === 1 ) { // 试卷名
          row.eachCell({
            includeEmpty: true
          }, (cell, colNumber) => {
            if (colNumber === 2) {
              result.title = _text(cell.value);
            }
          });
          return true;
        }

        if (rowNumber === 2 ) { // 题目列表标题
          return true;
        }

        const item = {
          type: '',
          question: '',
          options: [],
          answer: '',
          weight: 0,
          score: 0
        };

        row.eachCell({
          includeEmpty: true
        }, (cell, colNumber) => {
          let text = _text(cell.value);

          switch(colNumber) {
            case 1:
              item.type = text;
              break;
            case 2:
              item.question = text;
              break;
            case 3:
              text && item.options.push(`A. ${text}`);
              break;
            case 4:
              text && item.options.push(`B. ${text}`);
              break;
            case 5:
              text && item.options.push(`C. ${text}`);
              break;
            case 6:
              text && item.options.push(`D. ${text}`);
              break;
            case 7:
              text && item.options.push(`E. ${text}`);
              break;
            case 8:
              text && item.options.push(`F. ${text}`);
              break;
            case 9:
              if (item.type === MULT_CHOICES_TYPE) {
                item.answer = text.split('').join(',');
              } else {
                item.answer = text;
              }
              break;
            case 10:
              item.weight = parseInt(text, 10) || 0;
              break;
            case 11:
              item.score = parseInt(text, 10) || 0;
              break;
          }
        });

        result.questions.push(item);
      });
    });

    return result;
  });
}

function _isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

function _text(value) {
  if ( typeof value === 'string' || !value ) {
    return value;
  }

  if ( _isObject(value) && value.richText ) {
    let pText = '';

    (value.richText || []).forEach( item => {
      pText += item.text;
    });

    return pText;
  }

  return JSON.stringify(value);
}