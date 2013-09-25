/**
 * @name CCNY Senior Project
 * @authors: Emily Bodden, Sahat Yalkabov
 * @contributors: Emilie Chen, Hannah PyCon
 * @date May 5, 2013
 */
var async = require('async'),

    AWS = require('aws-sdk'),
    flash = require('connect-flash');
    crypto = require('crypto'),
    Case = require('case'),
    exec = require('child_process').exec,
    email = require('emailjs'),
    epubParser = require('epub-parser'),
    express = require('express'),
    filesize = require('filesize'),
    ffmpeg = require('fluent-ffmpeg'),
    Metalib = require('fluent-ffmpeg').Metadata,
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
    restler = require('restler'),
    util = require('util'),
    _ = require('underscore');

// Augment underscore.string with underscore library
_.str = require('underscore.string');
_.mixin(_.str.exports());

var config = require('./config.json'),
    User = require('./schema').User,
    FileSchema = require('./schema').File;

var alchemyAPI = require('./alchemy');

var app = express();


var userCount = 0;

// Connect to MongoDB
//mongoose.connect(config.MONGOLAB, function(err) {
mongoose.connect('localhost', function(err) {
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

FileSchema.pre('save', function (next) {
  // TODO: Use for error-validation
  next();
});

// Load Amazon AWS credentials
AWS.config.update({
  accessKeyId: config.AWS.accessKeyId,
  secretAccessKey: config.AWS.secretAccessKey,
  region: config.AWS.region
});

// Load an S3 bucket
var s3 = new AWS.S3({ params: { Bucket: config.AWS.bucket } });


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
            isAdmin: userCount < 1
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
  secret: 'topsecretz',
  store: new MongoStore({db:'localhost'})
  //store: new MongoStore({ url: config.MONGOLAB })
}));
app.use(flash());
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
app.get('/admin/users', loginRequired, function(req, res) {
  User.find(function(err, users) {
    res.render('admin-users', { user: req.user, userList: users });
  });
});


app.del('/admin/users/:googleId', function(req, res) {
  // Delete user
  User.findOne({ googleId: req.params.googleId }).remove();
  
  // Delete files from MongoDB and S3 that belong to the deleted user
  File.find({ user: req.params.googleId }, function(err, files) {
    for (var i=0; i<files.length; i++) {
      files[i].remove();
      s3.deleteObject({ Bucket: 'semanticweb', Key: files[i].path});
    }
  });
});


/**
 * PUT /admin/users
 * Update user's disk quota
 * @param  {Number} newQuota
 * @return {String} Success message
 */
app.put('/admin/users/:googleId', loginRequired, function(req, res) {
  var newQuota = req.body.newQuota;

  // Update user's quota
  User.findOne({ googleId: req.params.googleId }, function(err, user) {
    if (err) {
      console.error(err);
      return res.send(500, 'Error finding the user');
    }
    console.log(newQuota);
    user.diskQuota = newQuota;

    user.save(function(err) {
      if (err) {
        console.error(err);
        return res.send(500, 'Could not update disk quota');
      }

      res.send(200, 'Sucessfully updated disk quota');
    });
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
      if (err) {
        console.error(err);
        req.flash('info', 'Error retrieving files on Index route');
        return res.redirect('/');
      }
      res.render('index', {
        user: req.user,
        files: files
      });
    });
  } else {
    res.redirect('/login');
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
 * The first page that user sees when visiting for the first time
 */
app.get('/login', function(req, res) {
  res.render('login', { user: req.user });
});


/**
 * @route GET /logout
 */
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/login');
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
  passport.authenticate('google', { failureRedirect: '/login'}),
  function (req, res) {
    res.redirect('/');
  });


/**
 * GET /search
 * Perform advanced search query and filtering
 */
app.get('/search', loginRequired, function(req, res) {
  res.render('search')
});


/**
 * POST /search
 */
app.post('/search', loginRequired, function(req, res) {
  var searchQuery = req.body.q;

  // Prevent empty search queries
  if (!searchQuery) {
    return res.send({ 'Error': 'Search query requires a querystring parameter'});
  }

  // Find results even if some parts of search query matches (case-insensitive)
  var regularExpression = new RegExp(searchQuery, 'i');
  
  var searchConditions = {
    $or: 
      [
        { name: regularExpression },
        { tags: { $elemMatch: { text: searchQuery } } },
        { keywords: { $elemMatch: { text: searchQuery } } },
        { concepts: { $elemMatch: { text: searchQuery } } },
        { entities: { $elemMatch: { text: searchQuery } } },
        { keywords: { $elemMatch: { text: searchQuery } } },
        { extension: searchQuery },
        { category: regularExpression },
        { genre: regularExpression },
        { title: regularExpression },
        { artist: searchQuery },
        { albumArtist: searchQuery },
        { year: searchQuery },
        { album: regularExpression },
        { lastFmTags: regularExpression },
        { bookTitle: regularExpression },
        { bookAuthor: regularExpression },
        { bookPublishedDate: searchQuery },
        { bookCategory: regularExpression },
        { gender: { $elemMatch: { value: searchQuery } } },
        { smiling: {  } },
        { videoCodec: searchQuery },
        { videoAudioCodec: searchQuery },
        { videoResolution: searchQuery }
      ]
    // TODO: How to map smilling search to smiling: true?
  };

  File.find(searchConditions, function(err, files) {
    if (err) {
      console.error(err);
      req.flash('info', 'Error searching files');
      return res.redirect('/');
    }

    res.send({ files: files });
  });


});


/**
 * GET /upload
 * Upload form
 */
app.get('/upload', loginRequired, function(req, res) {
  res.render('upload', { 
    user: req.user,
    message: req.flash('info')
   });
});


/**
 * POST /upload
 * Uploads a file for a given user
 */
app.post('/upload', loginRequired, function(req, res) {

  // VALIDATION: No file has been selected
  if (!req.files.userFile.name) {
    req.flash('info', 'No file selected');
    return res.redirect('/upload');
  }
  console.log(req.files);

  // Grab data from user-submitted file
  var filePath = req.files.userFile.path;
  var fileName = req.files.userFile.name;
  var fileContentType = req.files.userFile.headers['content-type'];
  var fileExtension = filePath.split('.').pop().toLowerCase();
  var fileSize = req.files.userFile.size;
  var fileTags = req.body.tags ? req.body.tags.split(',') : [];
  var user = req.user;

  // Load file contents into memory
  var fileData = fs.readFileSync(filePath);


  // Similar to above, except the data will be loaded in chunks 
  // from a readable stream when it is requested. Used by the 
  // music-metadata library.
  var fileDataStream = fs.createReadStream(filePath)
    

  // Create a cryptographic hash of a filename
  var sha1 = crypto.createHash('sha1').update(fileData + user).digest('hex');
  

  // Construct a unique filename for Amazon S3
  var fileNameS3 = sha1 + '.' + fileExtension;


  // Perform multiple tasks in series
  async.series({
    
    checkDiskUsage: function(callback) {
      User.findOne({ 'googleId': req.user.googleId }, function(err, user) {
        user.diskUsage = user.diskUsage + fileSize;
        
        if (user.diskUsage > user.diskQuota) {
          req.flash('info', 'Disk Quota Exceeded');
          return res.redirect('/upload');
        }

        user.save(function(err) {
          if (err) {
            console.error(err);
            req.flash('info', 'Could not update user\'s disk usage');
            return res.redirect('/upload');
          }
          callback(null);
        });
      });
    },
    
    uploadToS3: function(callback) {
      console.info('Uploading to Amazon S3');

      var fileObject = {
        Key: fileNameS3,
        Body: fileData,
        ContentType: fileContentType
      };

      s3.putObject(fileObject, function(err, data) {
        if (err) {
          console.error(err);
          req.flash('info', 'Error uploading file to Amazon S3');
          return res.redirect('/upload');
        }
        callback(null, data.ETag);
      });
    },

    saveToDatabase: function(callback, ETag) {
      console.info('Saving to MongoDB');
      // Create a base file object
      var file = new File({
        name: fileName,
        extension: fileExtension,
        contentType: fileContentType,
        size: fileSize,
        friendlySize: filesize(fileSize, 2, false),
        path: fileNameS3,
        ETag: ETag,
        user: req.user.googleId
      });


      // Add custom tags to the above object
      _.each(fileTags, function(tag) {
        file.tags.push(tag);
      })

      // Perform data extraction based on the filetype
      switch(fileExtension) {
        case 'epub':
          console.info('Parsing:', fileExtension)

          epubParser.open(filePath, function (err, epubData) {
            var epub = epubData.raw.json.ncx;
            var title = epub.docTitle[0].text[0];
            var googleUrl = 'https://www.googleapis.com/books/v1/volumes?q=';
            request.get(googleUrl + title, function(error, response, body) {
              var items = JSON.parse(body).items;
              var bookTitle = items[0].volumeInfo.title;
              var bookAuthor = items[0].volumeInfo.authors[0];
              var bookPublishedDate = items[0].volumeInfo.publishedDate;
              var bookDescription = items[0].volumeInfo.description;
              var bookPageCount = items[0].volumeInfo.pageCount;
              var bookCategory = items[0].volumeInfo.categories[0];
              var bookAverageRating = items[0].volumeInfo.averageRating;
              var bookCover = items[0].volumeInfo.imageLinks ?
                items[0].volumeInfo.imageLinks.thumbnail : '';

              file.bookTitle = bookTitle;
              file.bookAuthor = bookAuthor;
              file.bookPublishedDate = bookPublishedDate;
              file.bookDescription = bookDescription;
              file.bookPageCount = bookPageCount;
              file.bookCategory = bookCategory;
              file.bookAverageRating = bookAverageRating;
              file.bookCover = bookCover;

              // Save to database
              file.save(function(err) {
                if (err) {
                  console.error(err);
                  req.flash('info', 'Unable to save to database (EPUB)');
                  return res.redirect('/upload');
                }
                callback(null);
              });
            });

          });
          break;
        case 'avi':
        case 'mp4':
        case 'mov':
        case 'flv':
//          var proc = new ffmpeg({ source: fileDataStream })
//            .withSize('120x90')
//            .takeScreenshots(5, './', function(err, filenames) {
//              if(err){
//                throw err;
//              }
//              console.log(filenames);
//              console.log('screenshots were saved');
//            });

          var metaObject = new Metalib(filePath, function(metadata, err) {
            console.log(metadata);
            //var meta = util.inspect(metadata, false, null);
            file.videoCodec = metadata.video.codec;
            file.videoBitrate = metadata.video.bitrate;
            file.videoResolution = metadata.video.resolution;
            file.videoFps = metadata.video.fps;
            file.videoAudioCodec = metadata.audio.codec;
            file.videoAudioBitrate = metadata.audio.bitrate;
            file.videoAudioSampleRate = metadata.audio.sample_rate;

            // Save to database
            file.save(function(err) {
              if (err) {
                console.error(err);
                req.flash('info', 'Unable to save to database (VIDEO)');
                return res.redirect('/upload');
              }
              callback(null);
            });

          });
          break;
        case 'md':
        case 'markdown':
        case 'rst':
        case 'txt':
          console.info('Parsing:', fileExtension);

          // Get the string representation of the binary file
          var text = fileData.toString();

          console.log(text + ": " + text.length + " characters, " +
            Buffer.byteLength(text, 'utf8') + " bytes");

          // Perform NLP analysis on text
          alchemyAPI(text, function(results) {
            file.keywords = results.keywords;
            file.category = results.category;
            file.concepts = results.concepts;
            file.entities = results.entities;

            // Save to database
            file.save(function(err) {
              if (err) {
                console.error(err);
                req.flash('info', 'Unable to save to database (TEXT)');
                return res.redirect('/upload');
              }
              callback(null);
            });
          });
          break;
        
        case 'pdf':
          console.info('Parsing:', fileExtension);


          // Use node.js child process to call a python library - pdfminer
          // pdf2txt.py is just a terminal command gets executed from node.js
          exec('python pdf2txt.py ' + filePath, function (err, stdout, stderr) {
            if (err || stderr) {
              console.error(err, stderr);
              req.flash('info', 'Error while parsing PDF file');
              return res.redirect('/upload');
            }


            // Grab stdout text and convert it to a string
            var text = stdout.toString();


            // Perform NLP analysis on text
            alchemyAPI(text, function(results) {
              file.keywords = results.keywords;
              file.category = results.category;
              file.concepts = results.concepts;
              file.entities = results.entities;


              // Save to database
              file.save(function(err) {
                if (err) {
                  console.error(err);
                  req.flash('info', 'Unable to save to database (PDF)');
                  return res.redirect('/upload');
                }
                callback(null);
              });
            });
          });
          break;

        case 'docx':
          console.info('Parsing:', fileExtension);


          // Use node.js child process to call a local python file
          // docx_extractor.py uses python-docx python library for parsing
          exec('python docxparser.py ' + filePath, function(err, stdout, stderr) {
            if (err || stderr) {
              console.error(err, stderr);
              req.flash('info', 'Error while parsing DOCX file');
              return res.redirect('/upload');
            }


            // Grab stdout text and convert it to a string
            var text = stdout.toString();
            

            // Perform NLP analysis on text
            alchemyAPI(text, function(results) {
              file.keywords = results.keywords;
              file.category = results.category;
              file.concepts = results.concepts;
              file.entities = results.entities;


              // Save to database
              file.save(function(err) {
                if (err) {
                  console.error(err);
                  req.flash('info', 'Unable to save to database (DOCX)');
                  return res.redirect('/upload');
                }
                callback(null);
              });
            });
          });
          break;

        case 'mp3':
          console.info('Parsing:', fileExtension);

          var parser = new mm(fileDataStream);
          
          // Extract MP3 metadata
          parser.on('metadata', function (parsedAudio) {

            // returns an array with a single element
            var artist = parsedAudio.artist[0];

            var track = parsedAudio.title;
            
            var trackInfoUrl = 'http://ws.audioscrobbler.com/2.0/?method=track.getInfo&' + 
            'api_key=' + config.LASTFM.api_key +
            '&artist=' + artist +
            '&track=' + track + 
            '&format=json';
            
          var similarArtistsUrl = 'http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&' +
            'api_key=' + config.LASTFM.api_key +
            '&artist=' + artist +
            '&format=json';
  
          var artistInfoUrl = 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&' +
            'api_key=' + config.LASTFM.api_key +
            '&artist=' + artist +
            '&format=json';

            // Get additional information from Last.fm and Musixmatch lyrics service
            async.parallel({
              musixMatch: function(extCallback) {
                console.log('Starting musixmatch waterfall task');
                async.waterfall([
                  function(innerCallback) {
                    console.log('Musixmatch: Getting Track ID');
                    var trackIdUrl = 'http://api.musixmatch.com/ws/1.1/track.search?' +
                      'q_track=' + track +
                      '&q_artist=' + artist +
                      '&f_has_lyrics=1' +
                      '&apikey=' + config.MUSIXMATCH;

                    request.get(trackIdUrl, function(error, response, body) {

                      var json = JSON.parse(body);
                      console.log(artist);
                      console.log(track);

                      var trackId = json.message.body.track_list[0].track.track_id;
                      console.log('TrackID:', trackId);
                      innerCallback(null, trackId);
                    });
                  },
                  function(trackId) {
                    console.log('Musixmatch: Getting Lyrics');
                    console.log('++++');
                    console.log('TrackID in lyrics function', trackId);
                    var lyricsUrl = 'http://api.musixmatch.com/ws/1.1/track.lyrics.get?' +
                      'track_id=' + trackId +
                      '&apikey=' + config.MUSIXMATCH;

                    request.get(lyricsUrl, function(error, response, body) {
                      var json = JSON.parse(body);
                      console.log(json);
                      var lyrics = json.message.body.lyrics.lyrics_body;
                      console.log(lyrics);
                      extCallback(null, lyrics);
                    });
                  }
                ]);
              },
              trackInfo: function(callback) {
                request.get(trackInfoUrl, function(error, response, body) {
                  var track = JSON.parse(body).track;
                  var trackDuration = track.duration; // number in milliseconds
                  var lastFmTags = [];
                  var albumCovers = [];

                  _.each(track.toptags.tag, function(tag) {
                    lastFmTags.push(tag.name);
                  });

                  // Some tracks don't have album information
                  if (track.album) {
                    _.each(track.album.image, function(img) {
                      albumCovers.push(img);
                    });
                  }

                  var trackInfo = {
                    albumCovers: albumCovers,
                    trackDuration: trackDuration,
                    lastFmTags: lastFmTags
                  };
                  
                  callback(null, trackInfo)
                });
              },
              artistInfo: function(callback) {
                request.get(artistInfoUrl, function(error, response, body) {
                  var artist = JSON.parse(body).artist;
                  
                  var artistImages = [];
                  
                  _.each(artist.image, function(img) {
                    artistImages.push(img);
                  });
                  
                  var artistBio = artist.bio.summary;
                  
                  var artistInfo = {
                    artistImages: artistImages,
                    artistBio: artistBio
                  };
                  
                  callback(null, artistInfo);
                });
              },
              similarArtists: function(callback) {
                request.get(similarArtistsUrl, function(error, response, body) {
                  var similarArtistsRaw = JSON.parse(body).similarartists.artist;
                  
                  var similarArtists = [];
                  
                  for (var i = 0; i < similarArtistsRaw.length; i++) {
                    similarArtists.push(similarArtistsRaw[i]);
                  }
                    
                  callback(null, similarArtists);
                });
              }
            }, function(err, data) {
              var trackInfo = data.trackInfo;
              var artistInfo = data.artistInfo;
              var similarArtists = data.similarArtists;
              var lyrics = data.musixMatch;

              console.log(parsedAudio)
              // Local extraction
              file.genre = parsedAudio.genre ? parsedAudio.genre : 'Unknown';
              file.title = parsedAudio.title;
              file.artist = parsedAudio.artist;
              file.albumArtist = parsedAudio.albumArtist ? parsedAudio.albumArtist : 'Unknown';
              file.year = parsedAudio.year ? parsedAudio.year : 'Unknown';
              file.album = parsedAudio.album ? parsedAudio.album : 'Unknown';
              file.albumCover = parsedAudio.picture; // buffer
              
              // Last.fm API
              file.albumCovers = trackInfo.albumCovers; // links
              file.trackDuration = trackInfo.trackDuration;
              file.lastFmTags = trackInfo.lastFmTags;
              file.artistImages = artistInfo.artistImages;
              file.artistBio = artistInfo.artistBio;
              file.similarArtists = similarArtists;
              file.lyrics = lyrics;
              
              file.save(function(err) {
                if (err) {
                  console.error(err);
                  req.flash('info', 'Unable to save to database (MP3)');
                  return res.redirect('/upload');
                }
                callback(null);
              });
              
            }); 
          });
          break;

        case 'jpeg':
        case 'jpg':
        case 'png':
          console.info('Parsing:', fileExtension);

          // Get image file that has been uploaded to Amazon S3
          var imageUrl = 'https://s3.amazonaws.com/' +
                          config.AWS.bucket + '/' + fileNameS3;

          // This URL will simply return a JSON response that we are going to parse
          var skyBiometry = 'http://api.skybiometry.com/fc/faces/detect' +
                            '?api_key=' + config.SKYBIOMETRY.api_key + 
                            '&api_secret=' + config.SKYBIOMETRY.api_secret + 
                            '&urls=' + imageUrl +
                            '&attributes=all';
          // with geometric information of the tag, eyes, nose and mouth,
          // as well as additional attributes such as gender.
          request.get(skyBiometry, function(error, response, body) {

            // Convert string to json
            var body = JSON.parse(body);

            file.width = body.photos[0].width;
            file.height = body.photos[0].height;

            // Sky Biometry doesn't always return "tags" key, especially
            // if you upload some random PNG image that has no info
            // on face, gender, etc.
            if (body.photos && body.photos[0].tags && body.photos[0].tags[0]) {
              file.recognizable = body.photos[0].tags[0].recognizable;
              file.yaw = body.photos[0].tags[0].yaw;
              file.roll = body.photos[0].tags[0].roll;
              file.pitch = body.photos[0].tags[0].pitch;
              file.face = body.photos[0].tags[0].attributes.face;
              file.gender = body.photos[0].tags[0].attributes.gender;
              file.glasses = body.photos[0].tags[0].attributes.glasses;
              file.smiling = body.photos[0].tags[0].attributes.smiling;
            }

            file.save(function(err) {
              if (err) {
                console.error(err);
                req.flash('info', 'Unable to save to database (IMG)');
                return res.redirect('/upload');
              }
              callback(null);
            })
          });
          break;

        default:
          console.info('Non-parsable format detected. Saving file as-is.');

          file.save(function(err) {
            if (err) {
              console.error(err);
              req.flash('info', 'Unable to save to database (NIL)');
              return res.redirect('/upload');
            }
            callback(null);
          });
          break;
      }
    },

    cleanup: function(callback) {
      console.info('Unlinking file');
      fs.unlink(filePath, function(err) {
        if (err) {
          console.error(err);
        }
        callback(null);
      });
    }
  }, function(err, results) {
      console.log('about to redirect');
      res.redirect('/');
  });
});


app.get('/static/:album', loginRequired, function(req, res) {
  var album = req.params.album;
  var pattern = new RegExp(album, 'i');

  File.findOne({ album: pattern }, function(err, file) {
    if (err) throw err;

    if (!file) {
      return res.send('File not found');
    }

    if (!file.albumCover) {
      return res.end();
    }

    res.writeHead(200, { 'Content-Type': 'image/jpg' });
    res.end(file.albumCover[0].data);
  });
});


// Retrieve detailed info about a file
app.get('/files/:id', loginRequired, function(req, res) {
  File.findOne({ _id: req.params.id }, function(err, file) {
    if (err) {
      console.error(err);
      return res.send(500, 'Error retrieving a file');
    }
    if (file) {
      var downloadUrl = 'https://s3.amazonaws.com/' + config.AWS.bucket +
        '/' + file.path;
      res.render('detail', {
        user: req.user,
        file: file,
        downloadUrl: downloadUrl
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
 * Deletes a file  for a given user
 */
app.del('/files/:id', loginRequired, function(req, res) {
  File.delete({ _id: req.params.id }, function(err, file) {
    if (err) {
      console.error(err);
      req.flash('info', 'Could not process delete request');
      return res.redirect('files/' + req.params.id);
    }
    if (file) return res.send(404, 'File not found');
    s3.deleteObject({ Bucket: 'semanticweb', Key: file.path});
  });
});



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});