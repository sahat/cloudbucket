/**
 * @name CCNY Senior Project
 * @authors: Emilie Bodden, Sahat Yalkabov
 * @contributors: Emilie Chen, Hannah PyCon
 * @date May 5, 2013
 */
var async = require('async'),
    email = require('emailjs'),
    everyauth = require('everyauth'),
    express = require('express'),
    Dropbox = require('dropbox'),
    http = require('http'),
    fs = require('fs'),
    mongoose = require('mongoose'),
    path = require('path'),
    request = require('request');

var routes = require('./routes'),
    schema = require('./schema'),
    user = require('./routes/user');


// Connect to MongoLab database
// Mongoose keeps connections open throughout the lifetime of the app
mongoose.connect('mongodb://sahat:sahat@ds051437.mongolab.com:51437/semanticweb');

var User = mongoose.model('User', schema.user);
var File = mongoose.model('File', schema.file);


var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  // intercept OPTIONS method
  if ('OPTIONS' === req.method) {
    res.send(200);
  } else {
    next();
  }
};

var app = express();


/**
 * The everyauth configuration for getting a current user
 * You may access a user object via req.user inside a route function
 * E.g. req.user.name.first - return user's first name
 * For more information refer User schema in schema.js file
 */
everyauth.everymodule.findUserById(function(userId, callback) {
  User.findById(userId, callback);
});


/**
 * Facebook Login Authentication
 * Here are the routes provided automatically by everyauth:
 * http://example.com/login - user sign in OR create a new account
 * http://example.com/logout - user sign out
 */
everyauth.facebook
  .appId('441524382606862')
  .appSecret('a6d6825b48aaadc0522fd7a66ebaefa8')
  .entryPath('/login')
  .redirectPath('/')
  .mobile(true)
  .findOrCreateUser(function(session, accessToken, accessTokExtra, fbUserMetadata) {
    var promise = this.Promise();

    // Query MongoDB to check whether current user exists in the database
    User.findOne({ 'id': fbUserMetadata.id }, function(err, foundUser) {

      // This error refers to MongoDB error, not whether user has been found
      if (err) return promise.fail(err);

      // If user is already in database - pass it on and skip the creation process
      if (foundUser) return promise.fulfill(foundUser);

      console.log(fbUserMetadata);
      // Create a new user object
      var newUser = new User({
        fbId: fbUserMetadata.id,
        accessToken: accessToken,
        name: {
          full: fbUserMetadata.name,
          first: fbUserMetadata.first_name,
          last: fbUserMetadata.last_name
        },
        username: fbUserMetadata.username,
        link: fbUserMetadata.link,
        gender: fbUserMetadata.gender,
        email: fbUserMetadata.email,
        timezone: fbUserMetadata.timezone,
        locale: fbUserMetadata.locale,
        verified: fbUserMetadata.verified,
        updatedTime: fbUserMetadata.updated_time
      });

      // Persist changes to database
      newUser.save(function (err) {
        if (err) return promise.fail(err);
        return promise.fulfill(newUser);
      });
    });
    return promise;
  });


// all environments
app.set('port', process.env.PORT || 2000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(allowCrossDomain);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'Cat' }));
app.use(everyauth.middleware());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}


app.get('/', function(req, res) {
  console.log(req.user);
  res.render('index');
});


app.get('/users', user.list);
app.get('/search', function(req, res) {
  request('localhost:9200', function(error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log(body);
    }
  });
});


/**
 * Creates a new user account
 * @param Full Name
 * @param Username
 * @param Email
 * @param Password
 * @return 200 OK
 */
app.post('/signup', function(req, res) {
  var user = new User({
    fullName: req.body.name,
    // TODO: username
    email: req.body.email,
    password: req.body.password
  });

  user.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log('User has been successfully created');
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
