var keystone = require('keystone');
var Excel = require('exceljs');
var Question = keystone.list('Question');
var TYPES_MAP = {
    '单选': 'choice',
    '多选': 'multiple-choices',
    '填空': 'cloze'
};

exports = module.exports = function (req, res) {

    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Set locals
    locals.section = 'uploadXLSX';
    locals.submitted = false;

    // On POST requests, add the Enquiry item to the database
    view.on('post', { action: 'import' }, function (next) {
        xlsx2json(req.files.file.path).then(questions => {
            (questions || []).forEach(q => {
                new Question.model({
                    name: q.question,
                    type: TYPES_MAP[q.type] || 'choice',
                    weight: q.weight || 1,
                    score: q.score || 1,
                    options: q.options || [],
                    answer: q.anwser
                }).save((err, item) => {
                    console.log(item);
                });
            });

            locals.submitted = true;
            next();
        });
    });

    view.render('upload_xlsx');
};

function xlsx2json(filename) {
    let sheets = [];

    return new Excel.Workbook().xlsx.readFile(filename).then(worksheets => {
        worksheets.eachSheet(worksheet => {
            worksheet.eachRow((row, rowNumber) => {
                if ( rowNumber === 1 ) {
                    return;
                }

                let item = {
                    type: '',
                    question: '',
                    options: [],
                    answer: ''
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
                            item.answer = text.split('').join(',');
                            break;
                    }

                    sheets.push(item);
                });
            });
        });

        return sheets;
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