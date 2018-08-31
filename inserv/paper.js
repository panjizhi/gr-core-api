const utils = require('../includes/utils');
const mongodb = require('../drivers/mongodb');
const paper = require('../dal/paper.dal');
const { DirectCheck, Check } = require('../includes/login');

module.exports = {
    GetCategories: (req, cb) =>
    {
        paper.GetCategories(null, utils.DefaultCallback(cb, 1));
    },
    GetManageableCategories: [
        Check(),
        (req, cb) =>
        {
            let subs = null;

            const { level, subjects } = req.session.login;
            if (level > 1)
            {
                if (subjects)
                {
                    const co = { subjects };
                    if (mongodb.Convert(co, { subjects: 1 }))
                    {
                        return cb(1);
                    }

                    subs = co.subjects;
                }
                else
                {
                    subs = [];
                }
            }

            paper.GetCategories(subs, utils.DefaultCallback(cb, 1));
        }
    ],
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
            count: 'uint',
            manageable: {
                type: 'uint',
                null: 1
            }
        }),
        mongodb.CheckObjectID('category', 'question'),
        (req, cb) =>
        {
            const { name, _category, _question, start, count, manageable } = req.body;

            let subs = null;
            if (manageable)
            {
                if (DirectCheck(req))
                {
                    return cb(1);
                }

                const { level, subjects } = req.session.login;
                if (level > 1)
                {
                    if (subjects)
                    {
                        const co = { subjects };
                        if (mongodb.Convert(co, { subjects: 1 }))
                        {
                            return cb(1);
                        }

                        subs = co.subjects;
                    }
                    else
                    {
                        subs = [];
                    }
                }
            }

            paper.GetMany(subs, name, _category, _question, start, count, utils.DefaultCallback(cb, 1));
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
