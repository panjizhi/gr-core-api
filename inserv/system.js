const utils = require('../includes/utils');
const systemDAL = require('../dal/system.dal');

const __optionKeys = { AUTO_SCHEDULE: 'auto-schedule' };

module.exports = {
    GetAutoScheduleOptions: (req, cb) =>
    {
        systemDAL.GetOptions(__optionKeys.AUTO_SCHEDULE, utils.DefaultCallback(cb, 1));
    },
    SaveAutoScheduleOptions: [
        utils.CheckObjectFields({ duration: 'uint' }),
        (req, cb) =>
        {
            const body = req.body;
            systemDAL.SaveOptions(__optionKeys.AUTO_SCHEDULE, body, utils.DefaultCallback(cb));
        }
    ]
};
