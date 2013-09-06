/**
 * @name CCNY Senior Project
 * @authors: Emilie Bodden, Sahat Yalkabov
 * @contributors: Emilie Chen, Hannah PyCon
 * @date May 5, 2013
 */
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
    //callbackURL: "http://localhost:3000/auth/google/callback"
    callbackURL: "http://cloudbucket.sahat.c9.io/auth/google/callback"
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
    File
    .find({ user: req.user.googleId })
    .sort('name')
    .exec(function(err, files) {
      if (err) {
        console.error(err);
        return res.send('Error fetching user files')
      }
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
    if (err) {
      console.error(err);
      return res.send('Unable to create a new user');
    }
    res.redirect('/');
  });

});


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
  /**
  * FLOW:
  * 1. Receive request
  * 2. Rename file (blocking operation)
  * 3. Upload to S3 (parallel)
  *    Create MongoDB object (parallel)
  *    Analyze file (parallel)
  * 4. Save analysis data to MongoDB
  */
  var filePath = getPath(req.files.userFile.path),
      fileName = req.files.userFile.name,
      fileExtension = filePath.split('.').pop().toLowerCase(),
      fileType = req.files.userFile.type,
      fileSize = req.files.userFile.size,
      fileLastModified = req.files.userFile.lastModifiedDate,
      relativePath = '';

  // Rename to a more readable filename (BLOCKING)
  fs.renameSync(filePath, fileName);

  // Get file contents (BLOCKING)
  var fileData = fs.readFileSync(fileName);

  // Initialize S3 Bucket
  var s3 = new AWS.S3({ params: { Bucket: 'semanticweb' } });

  // Upload a file to S3
  s3.createBucket(function() {
    s3.putObject({ Key: fileName, Body: fileData }, function(err, data) {
      if (err) {
        console.error(err);
        return res.send(500, 'Error while uploading a file to S3');
      }
    });
  });

  // Create a partial MongoDB object
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

  // File contents analysis
  switch(fileExtension) {
    /**
    TTTTTTTTTTTTTTTTTTTTTTTXXXXXXX       XXXXXXXTTTTTTTTTTTTTTTTTTTTTTT
    T:::::::::::::::::::::TX:::::X       X:::::XT:::::::::::::::::::::T
    T:::::::::::::::::::::TX:::::X       X:::::XT:::::::::::::::::::::T
    T:::::TT:::::::TT:::::TX::::::X     X::::::XT:::::TT:::::::TT:::::T
    TTTTTT  T:::::T  TTTTTTXXX:::::X   X:::::XXXTTTTTT  T:::::T  TTTTTT
            T:::::T           X:::::X X:::::X           T:::::T
            T:::::T            X:::::X:::::X            T:::::T
            T:::::T             X:::::::::X             T:::::T
            T:::::T             X:::::::::X             T:::::T
            T:::::T            X:::::X:::::X            T:::::T
            T:::::T           X:::::X X:::::X           T:::::T
            T:::::T        XXX:::::X   X:::::XXX        T:::::T
          TT:::::::TT      X::::::X     X::::::X      TT:::::::TT
          T:::::::::T      X:::::X       X:::::X      T:::::::::T
          T:::::::::T      X:::::X       X:::::X      T:::::::::T
          TTTTTTTTTTT      XXXXXXX       XXXXXXX      TTTTTTTTTTT
    */
    case 'txt':
      var textBody = fileData.toString();
      console.log(textBody);
      async.parallel({
        entities: function(callback){
          alchemy.entities(textBody, {}, function(err, response) {
            if (err) console.error(err);
            var entities = response.entities;
            callback(null, entities);
          });
        },
        category: function(callback) {
          alchemy.category(textBody, {}, function(err, response) {
            if (err) console.error(err);
            var category = response.category;
            callback(null, category);
          });
        },
        concepts: function(callback) {
          alchemy.concepts(textBody, {}, function(err, response) {
            if (err) console.error(err);
            var concepts = response.concepts;
            callback(null, concepts);
          });
        },
        keywords: function(callback) {
          alchemy.keywords(textBody, {}, function(err, response) {
            if (err) console.error(err);
            var keywords = response.keywords;
            callback(null, keywords);
          });
        }
      },
      function(err, results) {
        // TODO: Look up how parallel errors work
        if (err) return res.send(500, err);

        file.keywords = results.keywords;
        file.category = results.category;
        file.concepts = results.concepts;
        file.entities = results.entities;
        file.summary = _(textBody).truncate(500);
      });
      break;
    /**
    MMMMMMMM               MMMMMMMMPPPPPPPPPPPPPPPPP    333333333333333
    M:::::::M             M:::::::MP::::::::::::::::P  3:::::::::::::::33
    M::::::::M           M::::::::MP::::::PPPPPP:::::P 3::::::33333::::::3
    M:::::::::M         M:::::::::MPP:::::P     P:::::P3333333     3:::::3
    M::::::::::M       M::::::::::M  P::::P     P:::::P            3:::::3
    M:::::::::::M     M:::::::::::M  P::::P     P:::::P            3:::::3
    M:::::::M::::M   M::::M:::::::M  P::::PPPPPP:::::P     33333333:::::3
    M::::::M M::::M M::::M M::::::M  P:::::::::::::PP      3:::::::::::3
    M::::::M  M::::M::::M  M::::::M  P::::PPPPPPPPP        33333333:::::3
    M::::::M   M:::::::M   M::::::M  P::::P                        3:::::3
    M::::::M    M:::::M    M::::::M  P::::P                        3:::::3
    M::::::M     MMMMM     M::::::M  P::::P                        3:::::3
    M::::::M               M::::::MPP::::::PP          3333333     3:::::3
    M::::::M               M::::::MP::::::::P          3::::::33333::::::3
    M::::::M               M::::::MP::::::::P          3:::::::::::::::33
    MMMMMMMM               MMMMMMMMPPPPPPPPPP           333333333333333
    */
    case 'mp3':
      var parser = new mm(fs.createReadStream(fileName));
      parser.on('metadata', function (result) {
        console.log(result);
        file.genre = result.genre;
        file.title = result.title;
        file.artist = result.artist;
        file.albumArtist = result.albumArtist;
        file.year = result.year;
        file.album = result.album;
        file.albumCover = result.picture[0].data;
      });
      break;
    default:
      res.send('Format is not supported');
      break;
  }

  // Save to database
  file.save(function(err) {
    if (err) {
      console.error(err);
      return res.send(500, 'Could not save post-analysis file to database');
    }
    // Delete file from local disk
    fs.unlink(fileName, function(err) {
      if (err) console.error(err);
    });
  });

});

/**
 * New Folder or file
 */
app.post('/files', function(req, res) {
  var name = req.body.name;
  var file = new File({
    name: name,
    user: req.user.googleId
  });
  if (req.body.isFolder) {
    file.isFolder = true;
  }
  file.save(function(err) {
    res.send(200);
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
