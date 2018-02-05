const settings = require('./settings');
const workflow = require('./includes/workflow');
const app = require('./app');

const sopts = settings.server;

let spms = [];
if (sopts.protocol === 'https')
{
    const fs = require('fs');

    let cert = sopts.cert;
    spms.push({
        key: fs.readFileSync(cert.private),
        cert: fs.readFileSync(cert.public)
    });
}

spms.push(app);

const prot = require(sopts.protocol);
const server = prot.createServer.apply(null, spms);
server.listen(sopts.port);

process.on('SIGINT', () => server.close(() => process.exit()));
