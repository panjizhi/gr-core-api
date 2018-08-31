const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const settings = require('./settings');
const inserv = require('./inserv');
const router = require('./router');
const cors = require('cors');
const open = require('./open');
const api = require('./api');
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use('/assets', cors(), express.static('assets'));
const strgStgs = settings.storage;
app.use(strgStgs.path, cors(), express.static(strgStgs.local));

app.use(cookieParser());
app.use(session(settings.session));

app.use('/open', open);

app.use('/api', api);

app.use('/inserv', inserv);
app.use('/', router);

app.use((err, req, res) =>
{
    console.log(err);
    res.status(500).end();
});

module.exports = app;
