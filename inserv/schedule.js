const utils = require('../includes/utils');
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
        mongodb.CheckObjectID('candidate', 'paper'),
        (req, cb) =>
        {
            const { _paper, paper_name, _candidate, candidate_name, done, sorter, start, count } = req.body;
            schedule.GetMany(_paper, paper_name, _candidate, candidate_name, done, sorter, start, count, utils.DefaultCallback(cb, 1));
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
        (req, cb) =>
        {
            const { limit, detail } = req.body;
            schedule.GetAutoMany(limit, detail, utils.DefaultCallback(cb, 1));
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
            flow: {
                type: 'array',
                item: 'string'
            }
        }),
        mongodb.CheckObjectID('id'),
        (req, cb) =>
        {
            const { _id, name, flow } = req.body;
            schedule.SaveAutoSingle(_id, name, flow, utils.DefaultCallback(cb));
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
