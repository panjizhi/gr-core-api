var keystone = require('keystone');
var Question = keystone.list('Question');

exports = module.exports = function (req, res) {

	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Set locals
	locals.section = 'uploadXLSX';
	locals.submitted = false;

	// On POST requests, add the Enquiry item to the database
	view.on('post', { action: 'import' }, function (next) {
		console.log(req);
		locals.submitted = true;
		
		next();
	});

	view.render('upload_xlsx');
};
