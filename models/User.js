var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * User Model
 * ==========
 */
var User = new keystone.List('User', {
    label: '用户',
    plural: '用户'
});

User.add({
    name: {
        label: '姓名',
        type: Types.Name,
        required: true,
        index: true
    },
    email: {
        label: '邮箱',
        type: Types.Email,
        initial: true,
        required: true,
        unique: true,
        index: true
    },
    password: {
        label: '密码',
        type: Types.Password,
        initial: true,
        required: true
    }
}, '权限分配', {
    isAdmin: {
        label: '后台权限',
        type: Boolean,
        index: true
    }
});

// Provide access to Keystone
User.schema.virtual('canAccessKeystone').get(function() {
    return this.isAdmin;
});

/**
 * Registration
 */
User.defaultColumns = 'name, email, isAdmin';
User.register();
