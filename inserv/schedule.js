const { PERMISSIONS } = require('../includes/decl');
const utils = require('../includes/utils');
const { Check } = require('../includes/login');
const permission = require('../includes/permission');
const mongodb = require('../drivers/mongodb');
const schedule = require('../dal/schedule.dal');

module.exports = {
    GetMany: [
        utils.CheckObjectFields({
            paper: {
                type: 'string',
                null: 1
            },
            paper_name: {
                type: 'string',
                null: 1
            },
            candidate: {
                type: 'string',
                null: 1
            },
            candidate_name: {
                type: 'string',
                null: 1
            },
            done: {
                type: 'uint',
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
        Check(),
        mongodb.CheckObjectID('candidate', 'paper'),
        (req, cb) =>
        {
            const { classes } = req.session.login;
            const co = { classes };
            if (mongodb.Convert(co, { classes: 1 }))
            {
                return cb(1);
            }

            const { _paper, paper_name, _candidate, candidate_name, done, sorter, start, count } = req.body;
            schedule.GetMany(_paper, paper_name, _candidate, candidate_name, done, sorter, co.classes, start, count, utils.DefaultCallback(cb, 1));
        }
    ],
    GetAutoMany: [
        utils.CheckObjectFields({
            limit: {
                type: 'int',
                null: 1
            },
            detail: {
                type: 'int',
                null: 1
            }
        }),
        permission.Check({
            value: [
                PERMISSIONS.NEW_SCHEDULE,
                PERMISSIONS.AUTO_SCHEDULE
            ],
            or: 1
        }),
        (req, cb) =>
        {
            const { login } = req.session;
            const { limit, detail } = req.body;
            schedule.GetAutoMany(limit, detail, login, utils.DefaultCallback(cb, 1));
        }
    ],
    GetAutoSingle: [
        utils.CheckObjectFields({ id: 'string' }),
        mongodb.CheckObjectID('id'),
        (req, cb) =>
        {
            const { _id } = req.body;
            schedule.GetAutoSingle(_id, utils.DefaultCallback(cb, 1));
        }
    ],
    SaveMany: [
        utils.CheckObjectFields({
            candidates: {
                type: 'array',
                item: {
                    type: 'object',
                    fields: {
                        id: 'string',
                        name: 'string'
                    }
                }
            },
            papers: {
                type: 'array',
                item: {
                    type: 'object',
                    fields: {
                        id: 'string',
                        name: 'string'
                    }
                }
            }
        }),
        (req, cb) =>
        {
            const { candidates, papers } = req.body;
            schedule.SaveMany(candidates, papers, utils.DefaultCallback(cb));
        }
    ],
    SaveAutoSingle: [
        utils.CheckObjectFields({
            id: {
                type: 'string',
                null: 1
            },
            name: 'string',
            subject: 'string',
            flow: {
                type: 'array',
                item: 'string'
            }
        }),
        mongodb.ConvertInput({
            id: 1,
            subject: 1,
            flow: 1
        }),
        (req, cb) =>
        {
            const { id, name, subject, flow } = req.body;
            schedule.SaveAutoSingle(id, name, subject, flow, utils.DefaultCallback(cb));
        }
    ],
    RemoveSingle: [
        utils.CheckObjectFields({
            id: 'string'
        }),
        mongodb.CheckObjectID('id'),
        (req, cb) =>
        {
            const { _id } = req.body;
            schedule.RemoveMany([_id], utils.DefaultCallback(cb));
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
            schedule.RemoveMany(id, utils.DefaultCallback(cb));
        }
    ],
    RemoveAutoSingle: [
        utils.CheckObjectFields({ id: 'string' }),
        mongodb.CheckObjectID('id'),
        (req, cb) =>
        {
            const { _id } = req.body;
            schedule.RemoveAutoSingle(_id, utils.DefaultCallback(cb));
        }
    ]
};
