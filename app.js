// TODO: language support detection by NLTK

/**
 * @name CCNY Senior Project
 * @authors: Emilie Bodden, Sahat Yalkabov
 * @contributors: Emilie Chen, Hannah PyCon
 * @date May 5, 2013
 */
var async = require('async'),
    AWS = require('aws-sdk'),
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


var config = require('./config'),
    User = require('./schema').User,
    FileSchema = require('./schema').File;


var app = express();


// Connect to MongoDB
// TODO: MONGOLAB IS NOW USING GOOGL E CLOUD PLATFORM as host name is cloudbucket
mongoose.connect(config.MONGOLAB);

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
    callbackURL: "http://localhost:3000/auth/google/callback"
    //callbackURL: "http://semanticweb.aws.af.cm/auth/google/callback"
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
    File.find({ user: req.user.googleId }, function(err, files) {

      // Need to clone files array because it is immutable
      var filesWithFormatting = _.clone(files);

      // Prettify file sizes
      _.each(filesWithFormatting, function(file) {
        file.size = filesize(file.size);
      });

      res.render('index', {
        user: req.user,
        files: filesWithFormatting
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

/**
 * Creates a new file object for a given user
 * @param Username
 * @return 200 OK
 */
app.post('/files', function(req, res) {
  var path = '';

  // Windows uses backslash for file path, Linux uses forward slashuuuuuuiuhiu
  if (process.platform.match(/^win/)) {
     path = req.files.myFile.path.split("\\").slice(-1).join("\\");
  } else {
     path = req.files.myFile.path.split("/").slice(-1).join("/");
  }

  var file = {
    name: req.files.myFile.name,
    extension: path.split('.')[1].toLowerCase(),
    type: req.files.myFile.type,
    size: req.files.myFile.size,
    path: path,
    lastModified: req.files.myFile.lastModifiedDate,
    user: req.user.googleId
  };

  fs.readFile(path, function (err, data) {
    if (err) return res.send(500, err);

    var s3 = new AWS.S3({ params: { Bucket: 'semanticweb' } });

    s3.createBucket(function() {
      s3.putObject({ Key: path, Body: data }, function(err, data) {
        if (err) {
          console.log("Error uploading data: ", err);
        } else {
          console.log("Successfully uploaded data to semanticweb");

          // send a request to python cluster
          request.post({ url: 'http://127.0.0.1:5000', 
            form: { path:path, extension:path.split('.')[1].toLowerCase() } }, function(e, r, body) {
            


            console.log(body);
            // Save to MongoDB (OK to be asynchronous)
            var mongoFile = new File(file);

            // NLP analysis on file to generate keywords
            var tags = JSON.parse(body).tags
            console.log(tags);
            var myArr = tags;
            mongoFile.keywords = tags;

            // nltk analysis to generate summary
            mongoFile.summary = 'Quick document summary goes here';

            mongoFile.save(function(err) {
              if (err) return res.send(500, err);
              console.log('Saved file metadata to MongoDB successfully')
            });

            res.redirect('/');


          });
          console.log('Sent a POST request to Python');

          // delete temp file on disk, now that it is on S3
          fs.unlink(path, function (err) {
            if (err) return res.send(500, err);
            console.log('successfully deleted temp file');
          });

        }
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
