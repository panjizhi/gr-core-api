var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Student Model
 * ==========
 */

var Student = new keystone.List('Student', {
    label: '考生',
    autokey: {
        path: 'key',
        from: 'name',
        unique: true
    },
    noedit: true,
    nocreate: true,
    nodelete: false,
    plural: '考生'
});

Student.add({
    name: {
        label: '姓名',
        type: String,
        required: true
    },
    openid: {
        label: '微信ID',
        type: String
    },
    avatarUrl: {
        label: '用户头像',
        type: String
    },
    createTime: {
        label: '创建日期',
        type: Types.Datetime,
        default: Date.now
    }
});

Student.relationship({
    path: 'results',
    ref: 'Result',
    refPath: 'author'
});

Student.defaultColumns = 'name, createTime';
Student.register();
