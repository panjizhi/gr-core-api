const utils = require('../includes/utils');
const mongodb = require('../drivers/mongodb');
const candidateDAL = require('../dal/candidate.dal');
const { Check } = require('../includes/login');

module.exports = {
    GetCategories: [
        Check(),
        (req, cb) =>
        {
            const { classes } = req.session.login;
            const co = { classes };
            if (mongodb.Convert(co, { classes: 1 }))
            {
                return cb(1);
            }

            candidateDAL.GetCategories(co.classes, utils.DefaultCallback(cb, 1));
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
            candidateDAL.AddCategory(name, _parent, utils.DefaultCallback(cb));
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
            candidateDAL.RemoveCategory(_id, utils.DefaultCallback(cb));
        }
    ],
    GetMany: [
        utils.CheckObjectFields({
            category: {
                type: 'string',
                null: 1
            },
            start: 'uint',
            count: 'uint'
        }),
        Check(),
        mongodb.CheckObjectID('category', 'question'),
        (req, cb) =>
        {
            const { classes } = req.session.login;
            const co = { classes };
            if (mongodb.Convert(co, { classes: 1 }))
            {
                return cb(1);
            }

            const { name, _category, start, count } = req.body;
            candidateDAL.GetMany(name, _category, co.classes, start, count, utils.DefaultCallback(cb, 1));
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
            candidateDAL.GetSingle(_id, utils.DefaultCallback(cb, 1));
        }
    ],
    SaveSingle: [
        utils.CheckObjectFields({
            id: 'string',
            classes: {
                type: 'array',
                item: 'string',
                empty: 1,
                null: 1
            }
        }),
        mongodb.ConvertInput({
            id: 1,
            classes: 1
        }),
        (req, cb) =>
        {
            const { id, classes } = req.body;
            candidateDAL.SaveSingle(id, classes, utils.DefaultCallback(cb));
        }
    ],
    RemoveMany: [
        utils.CheckServiceStruct({
            type: 'object',
            fields: {
                id: {
                    type: 'array',
                    item: 'string'
                }
            }
        }),
        mongodb.ConvertInput({ id: 1 }),
        (req, cb) =>
        {
            const { id } = req.body;
            candidateDAL.RemoveMany(id, utils.DefaultCallback(cb));
        }
    ],
    SaveClassesMany: [
        utils.CheckObjectFields({
            candidates: {
                type: 'array',
                item: 'string'
            },
            classes: {
                type: 'array',
                item: 'string'
            }
        }),
        mongodb.ConvertInput({
            candidates: 1,
            classes: 1
        }),
        (req, cb) =>
        {
            const { candidates, classes } = req.body;
            candidateDAL.SaveClassesMany(candidates, classes, utils.DefaultCallback(cb));
        }
    ],
    GetCalendar: [
        utils.CheckObjectFields({
            candidate: 'string',
            begin: 'int',
            end: 'int'
        }),
        mongodb.ConvertInput({ candidate: 1 }),
        (req, cb) =>
        {
            const { candidate, begin, end } = req.body;
            candidateDAL.GetCalendar(candidate, begin, end, utils.DefaultCallback(cb, 1));
        }
    ],
    GetDateReport: [
        utils.CheckObjectFields({
            candidate: 'string',
            date: 'int'
        }),
        mongodb.ConvertInput({ candidate: 1 }),
        (req, cb) =>
        {
            const { candidate, date } = req.body;
            candidateDAL.GetDateReport(candidate, date, utils.DefaultCallback(cb, 1));
        }
    ],
    GetClassReport: [
        utils.CheckObjectFields({
            _class: 'string',
            date: 'int'
        }),
        mongodb.ConvertInput({ _class: 1 }),
        (req, cb) =>
        {
            const { _class, date } = req.body;
            candidateDAL.GetClassReport(_class, date, utils.DefaultCallback(cb, 1));
        }
    ]
};
