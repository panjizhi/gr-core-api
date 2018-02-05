const utils = require('../includes/utils');
const mongodb = require('../drivers/mongodb');
const result = require('../dal/result.dal');

module.exports = {
    GetMany: [
        utils.CheckServiceStruct({
            type: 'object',
            fields: {
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
                start: 'uint',
                count: 'uint'
            }
        }),
        mongodb.CheckObjectID('candidate', 'paper'),
        (req, cb) =>
        {
            const { _paper, paper_name, _candidate, candidate_name, start, count } = req.body;
            result.GetMany(_paper, paper_name, _candidate, candidate_name, start, count, utils.DefaultCallback(cb, 1));
        }
    ]
};
