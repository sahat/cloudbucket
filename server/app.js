/**
 * @name CCNY Senior Project
 * @authors: Emilie Bodden, Sahat Yalkabov
 * @contributors: Emilie Chen, Hannah PyCon
 * @date May 5, 2013
 */

// Node & NPM Module Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs'); // python scripts
var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');
var request = require('request');
var async = require('async');
// dropbox api
// zeromq
// hadoop mapreduce
var emailjs = require('emailjs');

/**
 * My Modules
 */
var routes = require('./routes');
var user = require('./routes/user');
var schema = require('./schema');

// google+ oauth


// save.pre handlers


// TODO: ElasticSearch hosting and mongolab create a database

mongoose.connect('localhost');


var User = mongoose.model('User', schema.user);
var File = mongoose.model('File', schema.file);

// All fields of File model will be indexed by elasticsearch
File.plugin(mongoosastic);

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/search', function(req, res) {
  request('localhost:9200', function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
    }
  });
});

app.post('/login', function(req, res) {

});

app.post('/signup', function(req, res) {

});


// Create a new file for a specified user
app.post('/:user/files', function(req, res) {


});

// Delete all files for a specified user
// Useful when a user is no longer active or has been banned
app.del('/:user/files', function(req, res) {

});

// Update all files for a specified user
app.put('/:user/files', function(req, res) {

});

// Update a given file for specified user
app.put('/:user/files/:id', function(req, res) {

});

app.del('/file/:id', function(req, res) {
  var fileId = req.params.id;



});



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
