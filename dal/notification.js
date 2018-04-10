const async = require('../includes/workflow');

const __events = {};

module.exports = {
    Bind: (action, event) =>
    {
        if (!(action in __events))
        {
            __events[action] = [];
        }

        __events[action].push(event);
    },
    Trigger: (action, params, cb) =>
    {
        const events = __events[action];
        if (!events)
        {
            return cb();
        }

        async.eachLimit(events, 5, (ins, cb) => ins(params, cb), cb);
    }
};
