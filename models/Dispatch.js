var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 *  试题派发 Model
 * ==========
 */

var Dispatch = new keystone.List('Dispatch', {
    label: '试题派发',
    map: {
        name: 'student'
    },
    plural: '试题派发'
});

Dispatch.add({
    student: {
        label: '考生',
        type: Types.Relationship,
        ref: 'Student',
        required: true
    },
    paper: {
        label: '试卷',
        type: Types.Relationship,
        ref: 'Paper'
    },
    isDone: {
        label: '完成状态',
        type: Types.Boolean,
        default: false
    }
});

Dispatch.defaultColumns = 'student, paper, isDone';
Dispatch.register();
