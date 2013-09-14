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
    crypto = require('crypto'),
    Case = require('case'),
    exec = require('child_process').exec,
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

// Augment underscore.string with underscore library
_.str = require('underscore.string');
_.mixin(_.str.exports());

var config = require('./config.json'),
    User = require('./schema').User,
    FileSchema = require('./schema').File;

var doAlchemy = require('./alchemy');

var app = express();


var userCount = 0;

// Connect to MongoDB
mongoose.connect(config.MONGOLAB, function(err) {
//mongoose.connect('localhost', function(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.info('Database connection established...OK');
  User.count({}, function(err, count) {
    userCount = count;
    console.log("Number of users:", count);
  });
});


var File = mongoose.model('File', FileSchema);

// Load Amazon AWS credentials
AWS.config.update(config.AWS);

// Load an S3 bucket
var s3 = new AWS.S3({ params: { Bucket: 'semanticweb' } });


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
          done(null, existingUser);
        } else {
          var user = new User({
            googleId: profile.id,
            accessToken: accessToken,
            displayName: profile.displayName,
            link: profile._json.link,
            picture: profile._json.picture,
            gender: profile._json.gender,
            email: profile._json.email,
            locale: profile._json.locale,
            verified: profile._json.verified_email,
            isAdmin: userCount < 1 ? true : false
          });
          user.save(function(err) {
            if (err) throw err;
            done(null, user);
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
app.locals.pretty = true;
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({
  uploadDir: __dirname,
  keepExtensions: true
}));
app.use(express.cookieParser());
app.use(express.session({
  secret: 'secret',
  store: new MongoStore({ url: config.MONGOLAB })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
// app.use(function(err, req, res, next) {
//   console.error(err.stack);
//   res.send(500, 'Something broke.');
// });

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


/**
 * Simple route middleware to ensure user is authenticated.
 * Use this route middleware on any resource that needs to be protected.  If
 * the request is authenticated (typically via a persistent login session),
 * the request will proceed.  Otherwise, the user will be redirected to the
 * login page.
 */
function loginRequired(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

/**
 * GET /admin/users
 * Display a list of users and their disk usage
 */
app.get('/admin/users', function(req, res) {
  User.find(function(err, users) {
    res.render('admin/users', { user: req.user, userList: users });
  });
});


app.del('/admin/users/:googleId', function(req, res) {
  // delete user and their files
});


/**
 * GET /admin/users/<google-id>
 */
app.get('/admin/users/:googleId', function(req, res) {
  User.findOne({ 'googleId': req.params.googleId }, function(err, user) {
    res.render('admin/profile', { user: req.user, profile: user });
  });
});

/**
 * GET /admin/manage-quota
 */
app.get('/admin/manage-quota', function(req, res) {
  User.find(function(err, users) {
    res.render('admin/manage-quota', { user: req.user, userList: users });
  });
});



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
app.get('/settings', loginRequired, function(req, res){
  res.render('settings', { user: req.user, active: 'active' });
});


/**
 * @route GET /login
 */
app.get('/login', function(req, res) {
  res.render('index', { user: req.user });
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



app.get('/search', function(req, res) {
  var searchQuery = req.query.q;

  var conditions = {
    user: req.user,
    $or: 
      [
        { name: /searchQuery/ },
        { tags: searchQuerry },
        { keywords: searchQuerry },
        { concepts: searchQuerry },
        { entities: searchQuerry },
        { keywords: searchQuerry },
        { extension: searchQuerry },
        { category: /searchQuerry/ },
        { genre: /searchQuerry/ },
        { title: /searchQuerry/ },
        { artist: searchQuerry },
        { albumArtist: searchQuerry },
        { year: searchQuerry },
        { album: /searchQuerry/ }
      ]
  };

  File.find(conditions, function(err, files) {
    if (err) throw err;

    console.log(files);

    res.send({ files: files });
  });


});


/**
 * GET /upload
 * Upload form
 */
app.get('/upload', loginRequired, function(req, res) {
  res.render('upload', { user: req.user });
});


/**
 * POST /upload
 * Uploads a file for a given user
 */
app.post('/upload', function(req, res) {
  // Users must select a file before upload
  if (!req.files) {
    console.error('Error: No file selected');
    return res.redirect('/upload');
  }

  var filePath = getPath(req.files.userFile.path);
  var fileName = req.files.userFile.name;
  var fileExtension = filePath.split('.').pop().toLowerCase();
  var fileType = req.files.userFile.type;
  var fileSize = req.files.userFile.size;
  var fileLastModified = req.files.userFile.lastModifiedDate;
  var tags = req.body.tags ? req.body.tags.split(',') : [];

  console.log(req.body.tags);
  // Read file contents into memory
  var fileData = fs.readFileSync(filePath);

  // Similar to above (used for music-metadata library)
  var fileDataStream = fs.createReadStream(filePath)
    
  // C);reate a cryptographic hash of a filename
  var sha1sum = crypto.createHash('sha1').update(fileData).digest('hex');
      

  async.series({
    
    checkDiskUsage: function(callback) {
      User.findOne({ 'googleId': req.user.googleId }, function(err, user) {
        user.diskUsage = user.diskUsage + fileSize;
        if (user.diskUsage > user.diskQuota) {
          callback('Error: Disk Quota Exceeded');
        }
        user.save();
        callback(null);
      });
    },
    
    uploadToS3: function(callback) {
      console.info('Uploading file to Amazon S3');
      s3.createBucket(function() {
        s3.putObject({ Key: sha1sum, Body: fileData }, function(err, data) {
          if (err) throw err;
          callback(null);
        });
      });
    },

    saveToDatabase: function(callback) {
      console.info('Saving to Database');
      var file = new File({
        name: fileName,
        extension: fileExtension,
        type: fileType,
        size: fileSize,
        friendlySize: filesize(fileSize),
        lastModified: fileLastModified,
        path: sha1sum,
        user: req.user.googleId
      });

      // Add user-defined tags
      _.each(tags, function(tag) {
        file.tags.push(tag);
      })

      switch(fileExtension) {
        
        case 'md':
        case 'markdown':
        case 'txt':
          console.info('Parsing TXT file');

          // Get raw text as a string
          var text = fileData.toString();

          // Perform NLP analysis on text
          doAlchemy(text, function(err, results) {
            file.keywords = results.keywords;
            file.category = results.category;
            file.concepts = results.concepts;
            file.entities = results.entities;

            // Save to database
            file.save(function(err) {
              if (err) throw err;
              console.log(file)
              callback(null);
            });
          });
          break;
        
        case 'pdf':
          console.info('Parsing PDF file');

          exec('pdf2txt.py ' + filePath, function (err, stdout, stderr) {
            console.info('=== PDF RESPONSE ===');
            console.info(stdout);

            // Get raw text as a string
            var text = stdout.toString();
            
            // Perform NLP analysis on text
            doAlchemy(text, function(err, results) {
              file.keywords = results.keywords;
              file.category = results.category;
              file.concepts = results.concepts;
              file.entities = results.entities;

              // Save to database
              file.save(function(err) {
                if (err) throw err;

                callback(null);
              });
            });
          });
          break;

        case 'docx':
          console.info('Parsing DOCX file');

          exec('python docx_extractor.py ' + filePath, function(err, stdout, stderr) {
            console.info('=== DOCX RESPONSE ===');
            console.info(stdout);

            // Get raw text as a string
            var text = stdout.toString();
            
            // Perform NLP analysis on text
            doAlchemy(text, function(err, results) {
              if (err) throw err;

              file.keywords = results.keywords;
              file.category = results.category;
              file.concepts = results.concepts;
              file.entities = results.entities;

              // Save to database
              file.save(function(err) {
                if (err) throw err;
                callback(null);
              });

            });
          });
        case 'mp3':
          console.info('Parsing MP3 file');

          var parser = new mm(fileDataStream);
          
          // Extract MP3 metadata
          parser.on('metadata', function (result) {
            file.genre = result.genre;
            file.title = result.title;
            file.artist = result.artist;
            file.albumArtist = result.albumArtist;
            file.year = result.year;
            file.album = result.album;
            file.albumCover = result.picture;
            // Save to database
            file.save(function(err) {
              if (err) throw err;
              callback(null);
            });
          });
          break;
        default:
          console.info('Non-parsable format detected. Save file as is.');
          file.save(function(err) {
            if (err) throw err;
            callback(null);
          });
          break;
      }
    },

    cleanup: function(callback) {
      console.info('Unlinking file');
      fs.unlink(filePath, function(err) {
        if (err) throw err;
        callback(null);
      });
    }
  }, function(err, cb) {
      res.redirect('/');
  });
});


app.get('/images/:album', function(req, res) {
  var album = req.params.album;
  var pattern = new RegExp(album, 'i');

  File.findOne({ album: pattern }, function(err, file) {
    if (err) throw err;

    if (!file) {
      return res.send('Album cover not found');
    }

    console.log(file)
    
    res.writeHead(200, { 'Content-Type': 'image/jpg' });
    res.end(file.albumCover[0].data.buffer);
  });
});


app.get('/convert', function(res, req) {
  // console.log();
  // var username = 'ca117fa0e6ba09f5c715cd8c5bac267a';
  // var password = '321ab681f15c42338efdfae3eb1d17a989c934ba';

  // var
  //   spawn = require('child_process').spawn,
  //   python  = spawn('python');

  // USE DOCSPLIT FOR DOCS
  var exec = require('child_process').exec;
  exec('pdf2txt.py senior.pdf', function (err, stdout, stderr) {
    console.log(stdout);
  });
  // python.stdin.write('print ("a")');
  // python.stdin.end();

  // python.stdout.on('data', function (data) {
  //         console.log(data.toString());
  // });


  // request({ 
  //   method: 'POST',
  //   uri: 'http://' + username + ':' + password + '@' + 'api.doxument.com/v1/docs.json',
  //   multipart: [{ 
  //     body: {
  //       'file': ''
  //     },
  //   }]
  // },
  // function (error, response, body) {
  //   console.log(body);
  // });

//   var form = new FormData();
//   var url = 'http://' + username + ':' + password + '@' + 'api.doxument.com/v1/docs.json';
  
//   var r = request.post(url)
//   var form = r.form()
//   form.append('file', fs.createReadStream(path.join(__dirname, 'lecture2.doc')));
//   form.submit(url, function(err, res) {
//     console.log(res);
//   });

//   fs.stat("lecture2.doc", function(err, stats) {
//     restler.post("http://posttestserver.com/post.php", {
//         multipart: true,
//         data: {
//             "folder_id": "0",
//             "filename": restler.file("lecture2.doc", null, stats.size, null)
//         }
//     }).on("complete", function(data) {
//         console.log(data);
//     });
// });

  // request.get('api.doxument.com/v1/docs.json?view=compact', function(e, r, b) {
  //   console.log(b);
  // });


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
  async.parallel({
    removeFromDatabase: function(callback) {
      File.delete({ '_id': req.params.id }, function(err, file) {
        if (err) throw err;
      });
    },

    removeFromS3: function(callback) {

    }
  });
  res.send('File has been deleted');
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
