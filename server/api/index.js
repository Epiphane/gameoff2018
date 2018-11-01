var express    = require('express');
var app        = new express();
var sqldb      = require('../sqldb');
var bodyParser = require('body-parser');
var Validator  = require('./validator');
var auth       = require('./auth/auth.service');

module.exports = app;

app.use(bodyParser.json());

app.get('/', function(req, res) {
   res.end('Hello!');
});

app.use('/', function(req, res, next) {
   req.validator = new Validator(req, res);
   next();
});

app.use('/auth', require('./auth')(sqldb, auth));
app.use('/world', require('./world')(sqldb, auth));
app.use('/user', auth.hasRole('admin'), require('./user')(sqldb, auth));
