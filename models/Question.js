var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * 考试题库 Model
 * ==========
 */

var Question = new keystone.List('Question', {
    label: '考题',
    plural: '考题'
});

Question.add({
    name: {
        label: '题目',
        type: Types.Text,
        required: true
    },
    type: {
        label: '题型',
        type: Types.Select,
        options: [{
            value: 'choice',
            label: '单选'
        },{
            value: 'multiple-choices',
            label: '多选'
        },{
            value: 'cloze',
            label: '填空'
        }],
        default: 'choice'
    },
    weight: {
        label: '词汇权重',
        type: Types.Number
    },
    score: {
        label: '题目分值',
        type: Types.Number
    },
    options: {
        label: '选项',
        type: Types.TextArray,
        dependsOn: {
            type: ['choice', 'multiple-choices']
        }
    },
    answer: {
        label: '正确答案',
        type: String
    }
});

Question.relationship({
    path: 'papers',
    ref: 'Paper',
    refPath: 'questions'
});

Question.defaultColumns = 'name, weight, score, answer';
Question.register();
