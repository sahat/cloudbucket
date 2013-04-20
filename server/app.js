/**
 * @name CCNY Senior Project
 * @authors: Emilie Bodden, Sahat Yalkabov
 * @contributors: Emilie Chen, Hannah PyCon
 * @date May 5, 2013
 */
var async = require('async'),
    email = require('emailjs'),
    express = require('express'),
    Dropbox = require('dropbox'),
    http = require('http'),
    flash = require('connect-flash'),
    fs = require('fs'),
    LocalStrategy = require('passport-local').Strategy,
    mongoose = require('mongoose'),
    passport = require('passport'),
    path = require('path'),
    request = require('request');

var routes = require('./routes'),
    schema = require('./schema'),
    user = require('./routes/user');



// save.pre handlers
// update elasticsearch index

// TODO: ElasticSearch hosting and mongolab create a database

// MongoLab Free Tier (0.5 GB) Instance
mongoose.connect('mongodb://sahat:sahat@ds051437.mongolab.com:51437/semanticweb');


var User = mongoose.model('User', schema.user);
var File = mongoose.model('File', schema.file);

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  }
  else {
    next();
  }
};

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(allowCrossDomain);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser('keyboard cat'));
app.use(express.session({ cookie: { maxAge: 60000 }}));
app.use(flash());
app.use(passport.initialize());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}



app.get('/flash', function(req, res){
  req.flash('info', 'Flash is back!')
  res.redirect('/');
});

app.get('/', function(req, res){
  res.render('index', { messages: req.flash('info') });
});

app.get('/users', user.list);
app.get('/search', function(req, res) {
  request('localhost:9200', function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
    }
  });
});

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/#homepage',
    failureRedirect: '/login',
    failureFlash: true
  })
);

app.post('/signup', function(req, res) {
  var user = new User({
    fullName: req.body.name,
    email: req.body.email,
    password: req.body.password
  });

  user.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log('User has been successfully created')
    }
  });

  res.end();
});


/**
 * Creates a new file object for a given user
 * @param Username
 * @return 200 OK
 */
app.post('/:user/files', function(req, res) {
  var user = req.params.user;
  // express post file transfer
  // mongo save to gridfs
  var file = new File({
    name: req.body.name,
    filetype: req.body.filetype,
    size: req.body.size,
    path: req.body.path,
    lastAccessed: req.body.lastAccessed,
    lastModified: req.body.lastModified
  });

  // NLP analysis on file to generate keywords
  var myArr = [];
  file.keywords.push(myArr);

  // nltk analysis to generate summary
  file.summary = '';

  file.save(function(err) {

  });
});

// Update all files for a specified user
app.put('/:user/files', function(req, res) {
  var user = req.params.user;

});

// Update a given file for specified user
app.put('/:user/files/:id', function(req, res) {
  var user = req.params.user;
  var fileId = req.params.id;
});

/**
 * Deletes a file object for a given user
 * @param Username
 * @param File ID
 * @return 200 OK
 */
app.del('/:user/files/:id', function(req, res) {
  var user = req.params.user;
  var fileId = req.params.id;

});



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
