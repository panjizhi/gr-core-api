const servFact = require('./serv-fact');

const router = servFact('inserv', [
    'index',
    'question',
    'candidate',
    'paper',
    'result',
    'schedule'
]);

module.exports = router;
