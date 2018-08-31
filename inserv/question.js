const utils = require('../includes/utils');
const mongodb = require('../drivers/mongodb');
const questionDAL = require('../dal/question.dal');

module.exports = {
    GetCategories: (req, cb) =>
    {
        questionDAL.GetCategories(utils.DefaultCallback(cb, 1));
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
            questionDAL.AddCategory(name, _parent, utils.DefaultCallback(cb, 1));
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
            questionDAL.RemoveMany([_id], utils.DefaultCallback(cb));
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
            questionDAL.RemoveMany(id, utils.DefaultCallback(cb));
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
            questionDAL.GetMany(name, _category, sorter, start, count, utils.DefaultCallback(cb, 1));
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
            questionDAL.GetSingle(_id, (err, dat) =>
            {
                if (err)
                {
                    return cb(1);
                }

                const ctr = [
                    null,
                    () => dat.score /= dat.content.count,
                    null,
                    null,
                ][dat.qtype];
                ctr && ctr();

                cb(0, dat);
            });
        }
    ],
    GetNameMany: [
        utils.CheckObjectFields({
            name: 'string',
            count: 'uint'
        }),
        (req, cb) =>
        {
            const { name, count } = req.body;
            questionDAL.GetNameMany(name, count, utils.DefaultCallback(cb, 1));
        }
    ],
    SaveSingle: [
        utils.CheckObjectFields({
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
            picture: {
                type: 'string',
                null: 1
            },
            explain: {
                type: 'string',
                null: 1
            },
            qtype: 'uint',
            content: {
                type: 'object',
                null: 1
            }
        }),
        mongodb.ConvertInput({
            id: 1,
            subject: 1,
            knowledges: 1,
            article: 1
        }),
        (req, cb) =>
        {
            const { body } = req;
            const ctr = [
                null,
                () => body.score *= body.content.count,
                null,
                null,
            ][body.qtype];
            ctr && ctr();
            questionDAL.SaveSingle(body, utils.DefaultCallback(cb));
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
            questionDAL.RemoveCategory(_id, utils.DefaultCallback(cb));
        }
    ],
    GetArticleMany: [
        utils.CheckObjectFields({
            name: {
                type: 'string',
                null: 1
            },
            start: 'uint',
            count: 'uint'
        }),
        (req, cb) =>
        {
            const { name, start, count } = req.body;
            questionDAL.GetArticleMany(name, start, count, utils.DefaultCallback(cb, 1));
        }
    ],
    AddArticle: [
        utils.CheckObjectFields({
            content: 'string',
            picture: 'string'
        }),
        (req, cb) =>
        {
            const { content, picture } = req.body;
            questionDAL.SaveArticle(content, picture, 0, utils.DefaultCallback(cb));
        }
    ]
};
