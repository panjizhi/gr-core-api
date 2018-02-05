module.exports = {
    Check: () => (req, cb) => cb(req.session.login ? 0 : -3),
    ExpressCheck: () => (req, res, next) => req.session.login ? next() : res.status(403).end()
};
