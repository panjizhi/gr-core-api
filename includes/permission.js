const common = require('../includes/common');
const utils = require('../includes/utils');
const { Check: CheckLogin } = require('../includes/login');

function Check(requirement, owned)
{
    if (!common.CompareType(requirement, 'object'))
    {
        return owned[requirement] ? 0 : -4;
    }

    const or = !!requirement.or;
    let forbidden = or ? 1 : 0;
    requirement.value.forEach(ins =>
    {
        const r = Check(ins, owned);
        if (or)
        {
            if (!r)
            {
                forbidden = 0;
                return false;
            }
        }
        else
        {
            if (r)
            {
                forbidden = 1;
                return false;
            }
        }
    });

    return forbidden;
}

module.exports = {
    Check: (requirement) =>
    {
        return (req, cb) =>
        {
            utils.CallRequestIterate(req, [
                CheckLogin(),
                (req, cb) =>
                {
                    const { permissions } = req.session.login;
                    const forbidden = Check(requirement, permissions);
                    cb(forbidden);
                }
            ], cb);
        };
    },
};
