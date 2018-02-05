const express = require('express');
const utils = require('./includes/utils');
const upload = require('./modules/upload');
const download = require('./modules/download');

const router = express.Router();

router.use((req, res, next) =>
{
    res.set('Connection', 'close');
    next();
});

router.use('/upload', upload);

router.use('/download', download);

router.use(utils.Return404());

module.exports = router;
