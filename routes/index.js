/**
 * This file is where you define your application routes and controllers.
 *
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 *
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 *
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 *
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 *
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */

var keystone = require('keystone');
var middleware = require('./middleware');
var importRoutes = keystone.importer(__dirname);

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Import Route Controllers
var routes = {
    views: importRoutes('./views')
};

var APIs = importRoutes('./api');

// Setup Route Bindings
exports = module.exports = function (app) {
    // Views
    app.get('/', routes.views.index);
    app.use('/contact', routes.views.contact);
    app.use('/upload/xlsx', routes.views.upload_xlsx);

    // APIs
    app.use('/api/', keystone.middleware.api);
    
    app.post('/api/user/session', APIs.wx.authority);
    app.post('/api/user/add', APIs.wx.addRealName);
    app.post('/api/exam/calculate', APIs.exam.calculate);
    app.get('/api/exam/list/:openid', APIs.exam.list);
    app.get('/api/exam/detail/:id', APIs.exam.detail);
    app.get('/api/exam/review/:id', APIs.exam.review);
    app.get('/api/exam/accomplish/:openid', APIs.exam.accomplish);

    // NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
    // app.get('/protected', middleware.requireUser, routes.views.protected);

};
