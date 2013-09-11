/**
 * @name CCNY Senior Project
 * @authors: Emilie Bodden, Sahat Yalkabov
 * @contributors: Emilie Chen, Hannah PyCon
 * @date May 5, 2013
 */


// TODO: semanticweb s3 files are still old filepath names
// TODO: change if (err) throw err;
// TODO: Catch all exceptions at the end, make a 500.html page
var async = require('async'),
  AWS = require('aws-sdk'),
  AlchemyAPI = require('alchemy-api'),
  Case = require('case'),
  email = require('emailjs'),
  express = require('express'),
  filesize = require('filesize'),
  Dropbox = require('dropbox'),
  http = require('http'),
  fs = require('fs'),
  mm = require('musicmetadata'),
  moment = require('moment'),
  mongoose = require('mongoose'),
  MongoStore = require('connect-mongo')(express),
  path = require('path'),
  passport = require('passport'),
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  request = require('request'),
  _ = require('underscore');

// Integrates underscore.string with underscore library
_.str = require('underscore.string');
_.mixin(_.str.exports());


var config = require('./config'),
  User = require('./schema').User,
  FileSchema = require('./schema').File;


var app = express();
var alchemy = new AlchemyAPI(config.ALCHEMY);


// Connect to MongoDB
mongoose.connect(config.MONGOLAB, function(err) {
  if (err) {
    console.error('Error connecting to database');
    process.exit();
  } else {
    console.info('Database connection established');
  }
});


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
    //callbackURL: "http://cloudbucket.sahat.c9.io/auth/google/callback"
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
  secret: '1aae4f5eb740067d22088604cd0dc189',
  store: new MongoStore({ url: config.MONGOLAB })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.errorHandler());
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.send(500, 'Something broke.');
})


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
    File
    .find({ user: req.user.googleId })
    .sort('name')
    .exec(function(err, files) {
      if (err) throw err;
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
 * @route GET /settings
 */
app.get('/settings', ensureAuthenticated, function(req, res){
  res.render('settings', { user: req.user, active: 'active' });
});


/**
 * @route GET /login
 */
app.get('/login', function(req, res) {
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
 * POST /signup
 * Creates a new user account
 */
app.post('/signup', function(req, res) {

  var user = new User({
    fullName: req.body.name,
    email: req.body.email,
    password: req.body.password
  });

  user.save(function (err) {
    if (err) return res.send(500, 'Unable to create a new user');
    res.redirect('/');
  });

});

app.use('/dropbox',express.directory('/var/lib/stickshift/5228e550e0b8cd205f0001b9/app-root/data/604724',
  {icons:true
	}
));

/**
 * GET /upload
 * Upload form
 */
app.get('/upload', function(req, res) {
  res.render('upload');
});


/**
 * POST /upload
 * Uploads a file for a given user
 */
app.post('/upload', function(req, res) {
  var filePath = getPath(req.files.userFile.path);
  var fileName = req.files.userFile.name;
  var fileExtension = filePath.split('.').pop().toLowerCase();
  var fileType = req.files.userFile.type;
  var fileSize = req.files.userFile.size;
  var fileLastModified = req.files.userFile.lastModifiedDate;
  var relativePath = '';

  // Rename downloaded file to a more readable name (BLOCKING)
  fs.renameSync(filePath, fileName);

  // Get file contents
  var fileData = fs.readFileSync(fileName);

  // Initialize S3 Bucket
  var s3 = new AWS.S3({ params: { Bucket: 'semanticweb' } });

  // Upload a file to S3
  s3.createBucket(function() {
    s3.putObject({ Key: fileName, Body: fileData }, function(err, data) {
      if (err) throw err;
    });
  });

  // Create a MongoDB object that is common to all file extensions
  var file = new File({
    name: fileName,
    extension: fileExtension,
    type: fileType,
    size: fileSize,
    friendlySize: filesize(fileSize),
    lastModified: fileLastModified,
    path: config.AWS + filePath,
    user: req.user.googleId
  });

  // Perform content analysis based on extension type
  switch(fileExtension) {
    case 'txt':
      var text = fileData.toString();
      console.log(text);
      async.parallel({
        entities: function(callback){
          alchemy.entities(text, {}, function(err, response) {
            if (err) console.error(err);
            var entities = response.entities;
            callback(null, entities);
          });
        },
        category: function(callback) {
          alchemy.category(text, {}, function(err, response) {
            if (err) console.error(err);
            var category = response.category;
            callback(null, category);
          });
        },
        concepts: function(callback) {
          alchemy.concepts(text, {}, function(err, response) {
            if (err) console.error(err);
            var concepts = response.concepts;
            callback(null, concepts);
          });
        },
        keywords: function(callback) {
          alchemy.keywords(text, {}, function(err, response) {
            if (err) console.error(err);
            var keywords = response.keywords;
            callback(null, keywords);
          });
        }
      },
      function(err, results) {
        if (err) throw err;

        file.keywords = results.keywords;
        file.category = results.category;
        file.concepts = results.concepts;
        file.entities = results.entities;
        file.summary = _(text).truncate(500);

        // Save to database
        file.save(function(err) {
          if (err) throw err;

          // Delete a file from local disk
          fs.unlink(fileName, function(err) {
            if (err) throw err;
          });
        });

      });
      break;
    case 'mp3':
      var parser = new mm(fs.createReadStream(fileName));
      
      parser.on('metadata', function (result) {
        file.genre = result.genre;
        file.title = result.title;
        file.artist = result.artist;
        file.albumArtist = result.albumArtist;
        file.year = result.year;
        file.album = result.album;
        file.albumCover = result.picture[0].data;

        // Save to database
        file.save(function(err) {
          if (err) throw err;

          // Delete file from local disk
          fs.unlink(fileName, function(err) {
            if (err) console.error(err);
          });
        });
      });
      break;
    default:
      res.send('Error: File format is not supported');
      break;
  }
});


// Retrieve detailed info about a file
app.get('/files/:id', function(req, res) {
  File.findOne({ '_id': req.params.id }, function(err, file) {
    if (file) {
      res.render('detail', { user: req.user, file: file });
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
