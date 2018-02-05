const common = require('../includes/common');
const utils = require('../includes/utils');
const mongodb = require('../drivers/mongodb');
const question = require('../dal/question.dal');

module.exports = {
    GetCategories: (req, cb) =>
    {
        question.GetCategories(utils.DefaultCallback(cb, 1));
    },
    AddCategory: [
        utils.CheckServiceStruct({
            type: 'object',
            fields: {
                name: 'string',
                parent: {
                    type: 'string',
                    null: 1
                }
            }
        }),
        mongodb.CheckObjectID('parent'),
        (req, cb) =>
        {
            const { name, _parent } = req.body;
            question.AddCategory(name, _parent, utils.DefaultCallback(cb, 1));
        }
    ],
    RemoveSingle: [
        utils.CheckServiceStruct({
            type: 'object',
            fields: {
                id: 'string'
            }
        }),
        mongodb.CheckObjectID('id'),
        (req, cb) =>
        {
            const { _id } = req.body;
            question.RemoveSingle(_id, utils.DefaultCallback(cb));
        }
    ],
    GetMany: [
        utils.CheckObjectFields({
            name: {
                type: 'string',
                null: 1
            },
            category: {
                type: 'string',
                null: 1
            },
            sorter: {
                type: 'object',
                item: 'int',
                null: 1
            },
            start: 'uint',
            count: 'uint'
        }),
        mongodb.CheckObjectID('category'),
        (req, cb) =>
        {
            const { name, _category, sorter, start, count } = req.body;
            question.GetMany(name, _category, sorter, start, count, utils.DefaultCallback(cb, 1));
        }
    ],
    GetSingle: [
        utils.CheckServiceStruct({
            type: 'object',
            fields: {
                id: 'string'
            }
        }),
        mongodb.CheckObjectID('id'),
        (req, cb) =>
        {
            const { _id } = req.body;
            question.GetSingle(_id, (err, dat) =>
            {
                if (err)
                {
                    return cb(1);
                }

                dat && question.Troubleshoot(dat);

                cb(0, dat);
            });
        }
    ],
    SaveSingle: [
        utils.CheckServiceStruct({
            type: 'object',
            fields: {
                id: {
                    type: 'string',
                    null: 1
                },
                name: 'string',
                subject: {
                    type: 'string',
                    null: 1
                },
                knowledges: {
                    type: 'array',
                    item: 'string',
                    null: 1,
                    empty: 1
                },
                score: 'uint',
                qtype: 'uint',
                content: {
                    type: 'object',
                    null: 1
                }
            }
        }),
        mongodb.CheckObjectID('id', 'subject'),
        (req, cb) =>
        {
            const params = req.body;
            question.SaveSingle(params, utils.DefaultCallback(cb));
        }
    ],
    RemoveCategory: [
        utils.CheckServiceStruct({
            type: 'object',
            fields: {
                id: 'string'
            }
        }),
        mongodb.CheckObjectID('id'),
        (req, cb) =>
        {
            const { _id } = req.body;
            question.RemoveCategory(_id, utils.DefaultCallback(cb));
        }
    ]
};
