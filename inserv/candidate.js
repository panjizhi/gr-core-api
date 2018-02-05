const utils = require('../includes/utils');
const mongodb = require('../drivers/mongodb');
const candidate = require('../dal/candidate.dal');

module.exports = {
    GetCategories: (req, cb) =>
    {
        candidate.GetCategories(utils.DefaultCallback(cb, 1));
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
            candidate.AddCategory(name, _parent, utils.DefaultCallback(cb));
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
            candidate.RemoveCategory(_id, utils.DefaultCallback(cb));
        }
    ],
    GetMany: [
        utils.CheckServiceStruct({
            type: 'object',
            fields: {
                category: {
                    type: 'string',
                    null: 1
                },
                start: 'uint',
                count: 'uint'
            }
        }),
        mongodb.CheckObjectID('category', 'question'),
        (req, cb) =>
        {
            const { name, _category, start, count } = req.body;
            candidate.GetMany(name, _category, start, count, utils.DefaultCallback(cb, 1));
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
            candidate.GetSingle(_id, utils.DefaultCallback(cb, 1));
        }
    ],
    SaveSingle: [
        utils.CheckServiceStruct({
            type: 'object',
            fields: {
                id: 'string',
                grade: {
                    type: 'string',
                    null: 1
                },
                class: {
                    type: 'string',
                    null: 1
                }
            }
        }),
        mongodb.CheckObjectID('id', 'grade', 'class'),
        (req, cb) =>
        {
            const params = req.body;
            candidate.SaveSingle(params, utils.DefaultCallback(cb));
        }
    ]
};
