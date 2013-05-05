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
    Dropbox = require('dropbox'),
    http = require('http'),
    fs = require('fs'),
    mongoose = require('mongoose'),
    MongoStore = require('connect-mongo')(express),
    path = require('path'),
    passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
    request = require('request');


var config = require('./config'),
    User = require('./schema').User,
    File = require('./schema').File;


var app = express();


// Connect to MongoDB
mongoose.connect(config.MONGOLAB);


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
app.use(express.static(path.join(__dirname, 'public')));
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
  res.render('index', { user: req.user });
});


/**
 * @route GET /account
 */
app.get('/account', ensureAuthenticated, function(req, res){
  res.render('settings', { user: req.user });
});


/**
 * @route GET /login
 */
app.get('/login', function(req, res){
  res.render('login', { user: req.user });
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
  res.render('search', { user: req.user });
});


app.post('/', function(req, res) {

  // Handle facebook post request
});
//
//app.get('/search', fb.checkSession, fb.getFriendIds, fb.getUserDetails, function(req, res, next) {
//
//  rest.get(
//      "http://api.rottentomatoes.com/api/public/v1.0/movies/" + req.query.rottenId + "?apikey=" + config.rottenTomatoesApiKey + "&page_limit=10&q=" + req.query.q
//    ).on('complete', function(data) {
//
//      var response = util.parseMovieResults(data);
//      util.addViewingData(req, res, next, response.cache, response.idx)
//
//    }).on('error', function(err) {
//      console.log('Error getting movies', err);
//    });
//});

//app.get('/search', function(req, res) {
//  request('localhost:9200', function(error, response, body) {
//    if (!error && response.statusCode === 200) {
//      console.log(body);
//    }
//  });
//});


/**
 * Creates a new user account
 * @param Full Name, Username, Email, Password
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

app.get('/files', function(req, res) {

});

/**
 * Creates a new file object for a given user
 * @param Username
 * @return 200 OK
 */
app.post('/files', function(req, res) {

  // TODO: change to linux path later
  var path = req.files.file.path.split("\\").slice(-1).join("\\");

  fs.readFile(path, function (err, data) {
    if (err) return res.send(500, err);

    var s3 = new AWS.S3({ params: { Bucket: 'semanticweb' } });

    s3.createBucket(function() {
      s3.putObject({ Key: path, Body: data }, function(err, data) {
        if (err) {
          console.log("Error uploading data: ", err);
        } else {
          console.log("Successfully uploaded data to myBucket/myKey");
        }
      });
    });

  });

  res.end();

//
//  var file = new File({
//    name: req.body.name,
//    filetype: req.body.filetype,
//    size: req.body.size,
//    path: req.body.path,
//    lastAccessed: req.body.lastAccessed,
//    lastModified: req.body.lastModified
//  });
//
//  // NLP analysis on file to generate keywords
//  var myArr = [];
//  file.keywords.push(myArr);
//
//  // nltk analysis to generate summary
//  file.summary = '';
//
//  file.save(function(err) {
//
//  });
});

// Update all files for a specified user
app.put('/files', function(req, res) {
  var user = req.params.user;

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
