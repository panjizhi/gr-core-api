const utils = require('../includes/utils');
const mongodb = require('../drivers/mongodb');
const paper = require('../dal/paper.dal');

module.exports = {
    GetCategories: (req, cb) =>
    {
        paper.GetCategories(utils.DefaultCallback(cb, 1));
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
            paper.AddCategory(name, _parent, utils.DefaultCallback(cb));
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
            paper.RemoveCategory(_id, utils.DefaultCallback(cb));
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
            question: {
                type: 'string',
                null: 1
            },
            start: 'uint',
            count: 'uint'
        }),
        mongodb.CheckObjectID('category', 'question'),
        (req, cb) =>
        {
            const { name, _category, _question, start, count } = req.body;
            paper.GetMany(name, _category, _question, start, count, utils.DefaultCallback(cb, 1));
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
            paper.GetSingle(_id, utils.DefaultCallback(cb, 1));
        }
    ],
    SaveSingle: [
        utils.CheckObjectFields({
            id: {
                type: 'string',
                null: 1
            },
            name: 'string',
            category: {
                type: 'string',
                null: 1
            },
            questions: {
                type: 'array',
                item: 'string',
                null: 1
            },
            score: 'uint',
            duration: 'uint',
            disorder: 'uint'
        }),
        mongodb.ConvertInput({
            id: 1,
            category: 1,
            questions: 1
        }),
        (req, cb) =>
        {
            const { body } = req;
            paper.SaveSingle(body, utils.DefaultCallback(cb));
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
            paper.RemoveMany([_id], utils.DefaultCallback(cb));
        }
    ],
    RemoveMany: [
        utils.CheckObjectFields({
            id: {
                type: 'array',
                item: 'string'
            }
        }),
        mongodb.ConvertInput({ id: 1 }),
        (req, cb) =>
        {
            const { id } = req.body;
            paper.RemoveMany(id, utils.DefaultCallback(cb));
        }
    ]
};
