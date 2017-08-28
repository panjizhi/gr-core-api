const Excel = require('exceljs');

xlsx2json('./sample.xlsx').then(args => console.log(args));

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