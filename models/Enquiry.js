var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * 反馈 Model
 * =============
 */

var Enquiry = new keystone.List('Enquiry', {
    label: '反馈',
    nocreate: true,
    noedit: true,
    plural: '反馈'
});

Enquiry.add({
    name: {
        label: '姓名',
        type: Types.Name,
        required: true
    },
    email: {
        label: '邮箱',
        type: Types.Email,
        required: true
    },
    phone: {
        label: '手机',
        type: String
    },
    enquiryType: {
        label: '类型',
        type: Types.Select,
        options: [{
            value: 'message',
            label: '普通留言'
        }, {
            value: 'question',
            label: '遇到问题'
        }, {
            value: 'other',
            label: '其他...'
        }]
    },
    message: {
        label: '内容',
        type: Types.Markdown,
        required: true
    },
    createdAt: {
        label: '时间',
        type: Date,
        default: Date.now
    }
});

Enquiry.schema.pre('save', function(next) {
    this.wasNew = this.isNew;
    next();
});

Enquiry.schema.post('save', function() {
    if (this.wasNew) {
        this.sendNotificationEmail();
    }
});

Enquiry.schema.methods.sendNotificationEmail = function(callback) {
    if (typeof callback !== 'function') {
        callback = function(err) {
            if (err) {
                console.error('There was an error sending the notification email:', err);
            }
        };
    }

    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
        console.log('Unable to send email - no mailgun credentials provided');
        return callback(new Error('could not find mailgun credentials'));
    }

    var enquiry = this;
    var brand = keystone.get('brand');

    keystone.list('User').model.find().where('isAdmin', true).exec(function(err, admins) {
        if (err) return callback(err);
        
        new keystone.Email({
            templateName: 'enquiry-notification',
            transport: 'mailgun',
        }).send({
            to: admins,
            from: {
                name: 'MyCMS',
                email: 'contact@mycms.com',
            },
            subject: 'New Enquiry for MyCMS',
            enquiry: enquiry,
            brand: brand,
        }, callback);
    });
};

Enquiry.defaultSort = '-createdAt';
Enquiry.defaultColumns = 'name, email, enquiryType, createdAt';
Enquiry.register();
