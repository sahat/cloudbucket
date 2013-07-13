/**
 * @name CCNY Senior Project
 * @authors: Emilie Bodden, Sahat Yalkabov
 * @contributors: Emilie Chen, Hannah PyCon
 * @date May 5, 2013
 */
var async = require('async'),
    AWS = require('aws-sdk'),
    AlchemyAPI = require('alchemy-api'),
    email = require('emailjs'),
    express = require('express'),
    filesize = require('filesize'),
    Dropbox = require('dropbox'),
    http = require('http'),
    fs = require('fs'),
    moment = require('moment'),
    mongoose = require('mongoose'),
    MongoStore = require('connect-mongo')(express),
    path = require('path'),
    passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    request = require('request'),
    _ = require('underscore');

// Case = require('case');

// TODO: Reserved for later
// Case.upper('foo_bar')                       -> 'FOO BAR'
// Case.lower('fooBar')                        -> 'foo bar'
// Case.snake('Foo bar!')                      -> 'foo_bar'
// Case.squish('foo.bar')                      -> 'FooBar'
// Case.camel('foo, bar')                      -> 'fooBar'
// Case.constant('Foo-Bar')                    -> 'FOO_BAR'
// Case.title('foo v. bar')                    -> 'Foo v. Bar'
// Case.capital('foo_v_bar')                   -> 'Foo V Bar'
// Case.sentence('"foo!" said bar', ['Bar'])   -> '"Foo!" said Bar'

// Case.of('foo')          -> 'lower'
// Case.of('foo_bar')      -> 'snake'
// Case.of('Foo v Bar')    -> 'title'
// Case.of('foo_ Bar')     -> undefined

// Case.flip('FlipMe')     -> 'fLIPmE'
// Case.flip('TEST THIS!') -> 'test this!'

// Case.type('bang', function(s) {
//     return Case.upper(s, '!')+'!';
// });
// Case.bang('bang')       -> 'BANG!'
// Case.of('TEST!THIS!')   -> 'bang'


var config = require('./config'),
    User = require('./schema').User,
    FileSchema = require('./schema').File;


var app = express();


// Connect to MongoDB
mongoose.connect(config.MONGOLAB);
var alchemy = new AlchemyAPI('15d085702f92ef2b5c85bb7f802da39d19c0fd59');

var File = mongoose.model('File', FileSchema);

// Load Amazon AWS credentials
AWS.config.loadFromPath('./aws.json');

/**
 * In this example, only the Google ID is serialized to the session,
 * keeping the amount of data stored within the session small.
 * When subsequent requests are received, this ID is used to find the user,
 * which will be restored to req.user.
 */
passport.serializeUser(function(user, done) {
  done(null, user.googleId);
});

passport.deserializeUser(function(googleId, done) {
  User.findOne({ 'googleId': googleId }, function(err, user) {
    done(err, user);
  });
});


/**
 * Use the GoogleStrategy within Passport.
 * Strategies in Passport require a `verification` function, which accept
 * credentials (in this case, an accessToken, refreshToken, and Google
 * profile), and invoke a callback 'done' with a user object.
 */
passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    //callbackURL: "http://localhost:3000/auth/google/callback"
    callbackURL: "http://semanticweb.sahat.c9.io/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      User.findOne({ 'googleId': profile.id }, function(err, existingUser) {
        if(existingUser) {
          console.log('User: ' + existingUser.displayName + ' found and logged in!');
          done(null, existingUser);
        } else {
          var newUser = new User({
            googleId: profile.id,
            accessToken: accessToken,
            displayName: profile.displayName,
            link: profile._json.link,
            picture: profile._json.picture,
            gender: profile._json.gender,
            email: profile._json.email,
            locale: profile._json.locale,
            verified: profile._json.verified_email
          });
          newUser.save(function(err) {
            if(err) return err;
            console.log('New user: ' + newUser.displayName + ' created and logged in!');
            done(null, newUser);
          });
        }
      });
    });
  }
));


// Express Configuration
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({
  uploadDir: __dirname,
  keepExtensions: true
}));
app.use(express.cookieParser());
app.use(express.session({
  secret: 'LOLCATS',
  store: new MongoStore({ url: config.MONGOLAB })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 99999 }));
app.enable('jsonp callback');
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
});


// Express development configuration
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}


/**
 * Simple route middleware to ensure user is authenticated.
 * Use this route middleware on any resource that needs to be protected.  If
 * the request is authenticated (typically via a persistent login session),
 * the request will proceed.  Otherwise, the user will be redirected to the
 * login page.
 */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}


/**
 * @route GET /index
 */
app.get('/', function(req, res) {
  if (req.user) {
    // Documents returned from queries with the lean option enabled are plain javascript objects, not MongooseDocuments.
    // They have no save method, getters/setters or other Mongoose magic applied.
    // And most importantly they are mutable, which allows us to apply formatting.
    File
    .find({ user: req.user.googleId })
    .sort('name')
    .lean()
    .exec(function(err, files) {
      
      // Format "filesize" and "last modified date" to be human readable
      _.each(files, function(file) {
        file.size = filesize(file.size);
        file.lastModified = moment(file.lastModified).fromNow();
      });

      res.render('index', {
        user: req.user,
        files: files
      });
    });
  } else {
    res.render('index', { user: req.user });
  }
});


/**
 * @route GET /account
 */
app.get('/account', ensureAuthenticated, function(req, res){
  res.render('settings', { user: req.user, active: 'active' });
});


/**
 * @route GET /login
 */
app.get('/login', function(req, res){
  res.render('/', { user: req.user });
});


/**
 * @route GET /logout
 */
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

/**
 * @route GET /auth/google
 * Use passport.authenticate() as route middleware to authenticate the
 * request.  The first step in Google authentication will involve
 * redirecting the user to google.com.  After authorization, Google
 * will redirect the user back to this application at /auth/google/callback
 */
app.get('/auth/google', passport.authenticate('google', {
  scope: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ]
}), function (req, res) {
  // The request will be redirected to Google for authentication, so this
  // function will not be called.
});

/**
 * GET /auth/google/callback
 * Use passport.authenticate() as route middleware to authenticate the
 * request.  If authentication fails, the user will be redirected back to the
 * login page.  Otherwise, the primary route function function will be called,
 * which, in this example, will redirect the user to the home page.
 */
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login'}), function (req, res) {
  res.redirect('/');
});

app.get('/search', function(req, res) {
  res.render('search');
});


app.post('/search', function(req, res) {
  User.search({ query: 'sahat' }, function(err, results) {

  });

  request.get('http://elastic-sahat.rhcloud.com', function(error, response, body) {
    res.send(body);
  });
});


/**
 * Creates a new user account
 * @param Full Name, Username, Email, Password
 * @return 200 OK
 */
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
      console.log('User has been successfully created');
    }
  });

  res.end();
});


app.get('/extract', function(req, res) {
  var AlchemyAPI = require('alchemy-api');
  var alchemy = new AlchemyAPI('15d085702f92ef2b5c85bb7f802da39d19c0fd59');


  async.parallel({
    entities: function(callback){
      alchemy.entities('http://www.cnn.com/2013/07/12/us/snowden-getaway-options/index.html', {}, function(err, response) {
        if (err) res.send(500, err);
        var entities = response.entities;
        callback(null, entities);
      });
    },
    concepts: function(callback) {
      alchemy.concepts('http://www.cnn.com/2013/07/12/us/snowden-getaway-options/index.html', {}, function(err, response) {
        if (err) res.send(500, err);
        var concepts = response.concepts;
        callback(null, concepts);
      });
    },
    keywords: function(callback) {
      alchemy.keywords('http://www.cnn.com/2013/07/12/us/snowden-getaway-options/index.html', {}, function(err, response) {
        if (err) res.send(500, err);
        var keywords = response.keywords;
        callback(null, keywords);
      });
    }
  },
  function(err, results) {
    if (err) return res.send(500, err);
    res.send(results);
  });
});

/**
 * Creates a new file object for a given user
 * @state Signed in
 * @return Redirect to home page
 */
app.post('/files', function(req, res) {
  var
    filePath = getPath(req.files.userFile.path),
    fileName = req.files.userFile.name,
    fileExtension = filePath.split('.').pop().toLowerCase(),
    fileType = req.files.userFile.type,
    fileSize = req.files.userFile.size,
    fileLastModified = req.files.userFile.lastModifiedDate;

  fs.readFile(filePath, function(err, fileData) {
    if (err) return res.send(500, err);
    var s3 = new AWS.S3({ params: { Bucket: 'semanticweb' } });
    s3.createBucket(function() {
      s3.putObject({ Key: filePath, Body: fileData }, function(err, data) {
        if (err) return res.send(500, err);

        // Extract Plain Text File
        if (fileExtension === 'txt') {
          var textBody = fileData.toString();
        } else {
          return res.send('Format not supported');
        }

        async.parallel({
          entities: function(callback){
            alchemy.entities(textBody, {}, function(err, response) {
              if (err) res.send(500, err);
              var entities = response.entities;
              callback(null, entities);
            });
          },
          category: function(callback) {
            alchemy.category(textBody, {}, function(err, response) {
              if (err) res.send(500, err);
              var category = response.category;
              callback(null, category);
            });
          },
          concepts: function(callback) {
            alchemy.concepts(textBody, {}, function(err, response) {
              if (err) res.send(500, err);
              var concepts = response.concepts;
              callback(null, concepts);
            });
          },
          keywords: function(callback) {
            alchemy.keywords(textBody, {}, function(err, response) {
              if (err) res.send(500, err);
              var keywords = response.keywords;
              callback(null, keywords);
            });
          }
        },
        function(err, results) {
          if (err) return res.send(500, err);
          var file = new File({
            name: fileName,
            extension: fileExtension,
            type: fileType,
            size: fileSize,
            lastModified: fileLastModified,
            keywords: results.keywords,
            category: results.category,
            concepts: results.concepts,
            entities: results.entities,
            path: 'https://s3.amazonaws.com/semanticweb/' + filePath,
            user: req.user.googleId
          });
          file.save(function(err) {
              if (err) return res.send(500, err);
              console.log('Saved file metadata to MongoDB successfully')
            });

          res.redirect('/');
          console.log(results);
        });

        fs.unlink(filePath, function (err) {
          if (err) return res.send(500, err);
          console.log('successfully deleted temp file');
        });
      });
    });
  });

  
});

// Update all files for a specified user
app.put('/files', function(req, res) {
  var user = req.params.user;

});

// Retrieve detailed info about a file
app.get('/files/:id', function(req, res) {
  File.findOne({ '_id': req.params.id }, function(err, file) {
    if (file) {
      res.render('detail', {
        user: req.user,
        file: file
      });
    } else {
      res.redirect('/');
    }
  });
});

// Update a given file for specified user
app.put('/files/:id', function(req, res) {
  var user = req.params.user;
  var fileId = req.params.id;
});

/**
 * Deletes a file object for a given user
 * @param Username
 * @param File ID
 * @return 200 OK
 */
app.del('/files/:id', function(req, res) {
  var user = req.params.user;
  var fileId = req.params.id;
});



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

/**
 * JavaScript Utilities
*/

function getPath(fullPath) {
   if (process.platform.match(/^win/)) {
     return fullPath.split("\\").slice(-1).join("\\");
  } else {
     return fullPath.split("/").slice(-1).join("/");
  }
}