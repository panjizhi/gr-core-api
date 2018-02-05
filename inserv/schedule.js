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
    RemoveSingle: [
        utils.CheckObjectFields({
            id: 'string'
        }),
        mongodb.CheckObjectID('id'),
        (req, cb) =>
        {
            const { _id } = req.body;
            schedule.RemoveSingle(_id, utils.DefaultCallback(cb));
        }
    ]
};
