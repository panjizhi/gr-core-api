var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 *  成绩 Model
 * ==========
 */

var Result = new keystone.List('Result', {
    label: '成绩',
    map: {
        name: 'paper'
    },
    noedit: true,
    nocreate: true,
    nodelete: false,
    plural: '成绩'
});

Result.add({
    score: {
        label: '得分',
        type: Types.Number
    },
    vocabulary: {
        label: '词汇量',
        type: Types.Number
    },
    author: {
        label: '考生',
        type: Types.Relationship,
        ref: 'Student'
    },
    paper: {
        label: '考卷',
        type: Types.Relationship,
        ref: 'Paper'
    },
    errJSON: {
        label: '错题汇总',
        type: Types.Text
    }
});

Result.defaultColumns = 'paper, author, score';
Result.register();
