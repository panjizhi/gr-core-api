var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * 试卷 Model
 * ==================
 */

var Paper = new keystone.List('Paper', {
    label: '试卷',
    plural: '试卷'
});

Paper.add({
    name: {
        label: '试卷',
        type: String,
        required: true
    },
    questions: {
        label: '题目',
        type: Types.Relationship,
        ref: 'Question',
        many: true
    }
});

Paper.relationship({
    path: 'students',
    ref: 'Result',
    refPath: 'paper'
});

Paper.register();
