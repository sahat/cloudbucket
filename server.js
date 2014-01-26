/**
 * @name CCNY Senior Project (Capstone II)
 * @authors: Emily Bodden, Sahat Yalkabov
 * @date December 12, 2013
 */
require('newrelic');

var async = require('async');
var flash = require('connect-flash');
var crypto = require('crypto');
var Case = require('case');
var exec = require('child_process').exec;
var email = require('emailjs');
var epubParser = require('epub-parser');
var express = require('express');
var filesize = require('filesize');
var ffmpeg = require('fluent-ffmpeg');
var Metalib = require('fluent-ffmpeg').Metadata;
var http = require('http');
var fs = require('fs');
var mm = require('musicmetadata');
var moment = require('moment');
var mongoose = require('mongoose');
var path = require('path');
var passport = require('passport');
var request = require('request');
var restler = require('restler');
var util = require('util');
var _ = require('underscore');


// Augment underscore.string with underscore library
_.str = require('underscore.string');
_.mixin(_.str.exports());


// OpenShift required environment variables
// Defaults to 127.0.0.1:8080 if running on localhost
var IP_ADDRESS = process.env.OPENSHIFT_NODEJS_IP ||  '127.0.0.1';
var PORT = process.env.OPENSHIFT_NODEJS_PORT || 3000;

// Import configuration data and database schema
// The config object contains API_KEYS and API_SECRETS
var config = require('./config');
var auth = require('./auth');
var User = require('./models/User');
var File = require('./models/File');


// Custom utility helper for doing NLP on text
var alchemyAPI = require('./alchemy');


// Initialize the web application
var app = express();


// Connect to MongoDB
mongoose.connect(config.db);
mongoose.connection.on('error', function() {
  console.log('← MongoDB Connection Error →');
});

// Express Configuration
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({
  uploadDir: __dirname + '/public',
  keepExtensions: true
}));
app.use(express.cookieParser());
app.use(express.session({
  secret: 'caa32bec3617f9fbd8ec618b34f031b83ab614fe'
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


///////////////////////
// ROUTES START HERE //
///////////////////////

/**
 * GET /admin/users
 * Display a list of users and their disk usage
 */
app.get('/admin/users', auth.isAuthenticated, function(req, res) {
  User.find(function(err, users) {
    res.render('admin-users', {
      user: req.user,
      userList: users
    });
  });
});


/**
 * DEL /admin/users/:googleId
 * @param googleId
 * Deletes a user from the admin dashboard
 */
app.del('/admin/users/:googleId', function(req, res) {
  // Delete user
  User.findOne({ googleId: req.params.googleId }).remove();
  
  // Delete corresponding files from MongoDB
  File.find({ user: req.params.googleId }, function(err, files) {
    for (var i=0; i<files.length; i++) {
      files[i].remove();
    }
  });
});


/**
 * PUT /admin/users
 * Update user's disk quota
 * @param  googleId, newQuota
 */
app.put('/admin/users/:googleId', auth.isAuthenticated, function(req, res) {
  var newQuota = req.body.newQuota;

  // Update user's quota
  User.findOne({ googleId: req.params.googleId }, function(err, user) {
    if (err) {
      console.error(err);
      return res.send(500, 'Error finding the user');
    }
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
 * GET /index
 * The main interface that displays a list of files
 */
app.get('/', function(req, res) {
  // Display a list of files only if a user is logged in
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
        message: req.flash('info'),
        files: files
      });
    });
  } else {
    // Otherwise send a user to the login page
    res.redirect('/login');
  }
});


/**
 * GET /settings
 * Display user settings with an option to delete their account
 */
app.get('/settings', auth.isAuthenticated, function(req, res){
  res.render('settings', {
    user: req.user,
    active: 'active'
  });
});


/**
 * GET /login
 * The first page that user sees when visiting for the first time
 */
app.get('/login', function(req, res) {
  res.render('login', {
    user: req.user
  });
});


/**
 * GET /logout
 * Log user out from the application
 */
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/login');
});


/**
 * GET /auth/google
 * Use passport.authenticate() as route middleware to authenticate the
 * request. The first step in Google authentication will involve
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
 */
app.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }));




/**
 * GET /search
 * Display a page for custom content-based filtering
 * Another Navbar search is located in _header.jade
 */
app.get('/search', auth.isAuthenticated, function(req, res) {
  res.render('search', {
    user: req.user,
    message: req.flash('message')
  });
});


/**
 * POST /search
 * Basic search query from the page header
 */
app.post('/search', auth.isAuthenticated, function(req, res) {
  var query = req.body.q;

  if (!query) {
    req.flash('message', 'Search query cannot be empty');
    return res.redirect('/search');
  }

  // Find results even if some parts of search query matches (case-insensitive)
  var regex = new RegExp(query, 'i');

  var searchConditions;

  if (query.match('smile') || query.match('smiling')) {

    var smiling;

    if (query.toLowerCase() === 'smiling' ||
      query.toLowerCase() === 'is smiling' ||
      query.toLowerCase() === 'has smile') {
      smiling = 'true';
    } else if (query.toLowerCase() === 'not smiling' ||
      query.toLowerCase() === 'is not smiling' ||
      query.toLowerCase() === 'does not have smile') {
      smiling = 'false';
    }

    searchConditions = {
      $and: [
        { user: req.user.googleId },
        { 'smiling.value': smiling }
      ]
    };

  } else {

    // TODO: x.match(/example/i)
             //["Example"]

    // TODO: ensure ^^ on tags:
    searchConditions = {
      $and: [
        { user: req.user.googleId },
        { $or: [
          { name: regex },
          { tags: { $in: [regex] } },
          { keywords: { $elemMatch: { text: regex } } },
          { concepts: { $elemMatch: { text: regex } } },
          { entities: { $elemMatch: { text: regex } } },
          { keywords: { $elemMatch: { text: regex } } },
          { extension: regex },
          { category: regex },
          { genre: regex },
          { title: regex },
          { artist: regex },
          { albumArtist: regex },
          { year: query },
          { album: regex },
          { lastFmTags: regex },
          { bookTitle: regex },
          { bookAuthor: regex },
          { bookPublishedDate: query },
          { bookCategory: regex },
          { 'gender.value': regex },
          { videoCodec: regex },
          { videoAudioCodec: regex },
          { videoResolution: query }
        ]}
      ]
    };
  }


  File.find(searchConditions, function(err, files) {
    if (err) {
      console.error(err);
      req.flash('info', 'Error searching files');
      return res.redirect('/');
    }

    console.log(files);

    res.render('index', {
      user: req.user,
      files: files
    });
  });
});


/**
 * POST /search/category
 * Part of the custom searching that finds files
 * based on their generic filetype, e.g. image, video, music
 */
app.get('/search/category/:type', auth.isAuthenticated, function(req, res) {
  var categoryType = req.params.type;
  var query = '';

  // TODO: iterate in $or
  var filetypes = {
    image: ['jpg', 'jpeg', 'tif', 'tiff', 'gif', 'raw', 'bmp', 'png', 'fpx', 'pcd', 'psd', 'ai', 'eps', 'svg', 'ps'],
    video: ['3g2', '3gp', 'asf', 'asx', 'avi', 'flv', 'divx', 'mov', 'mp4', 'mpg', 'rm', 'swf', 'wmv'],
    audio: ['mp3', 'm4a', 'wma', 'wav', 'ra', 'aif', 'ogg', 'aac', 'flac'],
    code: ['asp', 'aspx', 'html', 'css', 'js', 'jsp', 'php', 'c', 'cpp', 'java', 'py', 'lua', 'm', 'h', 'sh', 'rb', 'vb']
  }

  if (categoryType === 'pictures') {
    query = {
      $or: [
        { extension: 'jpg' },
        { extension: 'jpeg' },
        { extension: 'tif' },
        { extension: 'tiff' },
        { extension: 'gif' },
        { extension: 'raw' },
        { extension: 'bmp' },
        { extension: 'png' },
        { extension: 'fpx' },
        { extension: 'pcd' },
        { extension: 'psd' },
        { extension: 'ai' },
        { extension: 'eps' },
        { extension: 'svg' },
        { extension: 'ps' }
      ]
    }
  } else if (categoryType === 'videos') {
    query = {
      $or: [
        { extension: '3g2' },
        { extension: '3gp' },
        { extension: 'asf' },
        { extension: 'asx' },
        { extension: 'avi' },
        { extension: 'flv' },
        { extension: 'divx' },
        { extension: 'mov' },
        { extension: 'mp4' },
        { extension: 'mpg' },
        { extension: 'rm' },
        { extension: 'swf' },
        { extension: 'wmv' }
      ]
    }
  } else if (categoryType === 'music') {
    query = {
      $or: [
        { extension: 'mp3' },
        { extension: 'm4a' },
        { extension: 'wma' },
        { extension: 'wav' },
        { extension: 'ra' },
        { extension: 'aif' },
        { extension: 'ogg' },
        { extension: 'aac' },
        { extension: 'flac' }
      ]
    };
  } else if (categoryType === 'code') {

    query = {
      $or: [
        { extension: 'asp' },
        { extension: 'aspx' },
        { extension: 'html' },
        { extension: 'css' },
        { extension: 'js' },
        { extension: 'jsp' },
        { extension: 'php' },
        { extension: 'c' },
        { extension: 'cpp' },
        { extension: 'java' },
        { extension: 'py' },
        { extension: 'clas' },
        { extension: 'lua' },
        { extension: 'm' },
        { extension: 'h' },
        { extension: 'sh' },
        { extension: 'vcxproj' },
        { extension: 'xcodeproj' },
        { extension: 'rb' },
        { extension: 'vb' }
      ]
    };
  } else if (categoryType === 'pdf') {
    query = { extension: 'pdf' };
  } else if (categoryType === 'people') {
    query = { recognizable: true };
  } else if (categoryType === 'desktop') {
    query = { uploadDevice: 'PC' }
  } else if (categoryType === 'android') {
    query = { uploadDevice: 'Android' }
  } else if (categoryType === 'ios') {
    query = { uploadDevice: 'iOS' }
  } else {
    return res.redirect('/');
  }

  File
    .find(query)
    .where('user').equals(req.user.googleId)
    .exec(function(err, files) {
      if (err) {
        console.error(err);
        req.flash('info', 'Error searching files');
        return res.redirect('/');
      }

      res.render('index', {
        user: req.user,
        files: files
      });
    });

});


/**
 * GET /upload
 * Display an upload form
 */
app.get('/upload', auth.isAuthenticated, function(req, res) {
  res.render('upload', { 
    user: req.user,
    message: req.flash('info')
   });
});


/**
 * POST /upload
 * Uploads a file for a given user
 */
app.post('/upload', auth.isAuthenticated, function(req, res) {
  
  // Check if no file has been selected
  if (!req.files.userFile.name) {
    req.flash('info', 'No file selected');
    
    // Delete garbage file that gets sent from the client
    fs.unlink(req.files.userFile.path, function(err) {
      if (err) console.error(err);
    });
    return res.redirect('/upload');
  }

  // Grab data from user-submitted file
  var filePath = req.files.userFile.path;
  var fileName = req.files.userFile.name;
  // Different systems have different ways of accessing content-type
  var fileContentType = req.files.userFile.headers ?
    req.files.userFile.headers['content-type'] :
    req.files.userFile.type ;
  var fileExtension = filePath.split('.').pop().toLowerCase();
  var fileSize = req.files.userFile.size;
  var fileTags = req.body.tags ? req.body.tags.split(',') : [];
  var user = req.user;
  var uploadDevice = req.body.uploadDevice;

  // Load file contents into memory
  var fileData = fs.readFileSync(filePath);

  // Similar to above, except the data will be loaded in chunks 
  // from a readable stream when it is requested. Used by the 
  // music-metadata library.
  var fileDataStream = fs.createReadStream(filePath)

  // Create a cryptographic hash of a filename
  var sha512 = crypto.createHash('sha512').update(fileData + user).digest('hex');

  // Construct a unique filename for Amazon S3
  var fileNameS3 = sha512 + '.' + fileExtension;

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

    saveToDatabase: function(callback) {
      console.info('Saving to MongoDB');
      // Create a base file object
      var file = new File({
        name: fileName,
        extension: fileExtension,
        contentType: fileContentType,
        size: fileSize,
        friendlySize: filesize(fileSize, 2, false),
        path: fileNameS3,
        user: req.user.googleId,
        uploadDevice: uploadDevice
      });


      // Add custom tags to the above object
      _.each(fileTags, function(tag) {
        file.tags.push(tag);
      });

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
          exec('python py/pdf2txt.py ' + filePath, function (err, stdout, stderr) {
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
          exec('python py/docxparser.py ' + filePath, function(err, stdout, stderr) {
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
                      try {
                        var trackId = json.message.body.track_list[0].track.track_id;
                      } catch(e) {
                        return innerCallback(e);
                      }
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
                ], function(err, result) {
                  if (err) console.error('Halting musixmatch lyrics request', err);
                  extCallback(null);
                });
              },
              trackInfo: function(callback) {
                request.get(trackInfoUrl, function(error, response, body) {
                  try {
                    var track = JSON.parse(body).track;
                    var trackDuration = track.duration; // number in milliseconds
                  } catch(e) {
                    console.log('error in try catch');
                    callback(e);
                  }
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

                  var len = 10;
                  if (similarArtistsRaw.length < 10) {
                    len = similarArtistsRaw.length;
                  }
                  for (var i = 0; i < len; i++) {
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

              // Local metadata extraction
              file.genre = parsedAudio.genre ? parsedAudio.genre : 'Unknown';
              file.title = parsedAudio.title;
              file.artist = parsedAudio.artist;
              file.albumArtist = parsedAudio.albumArtist ? parsedAudio.albumArtist : 'Unknown';
              file.year = parsedAudio.year ? parsedAudio.year : 'Unknown';
              file.album = parsedAudio.album ? parsedAudio.album : 'Unknown';
              file.albumCover = parsedAudio.picture; // buffer
              
              // Get metadata from Last.fm API
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
          var imageUrl = '/' + fileNameS3;

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
      console.info('Deleting temporary saved file');
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


/**
 * GET /static/:album
 * Locally extracted music files will have their album art
 * stored in binary. This route will properly set binary
 * data to image type and display it in the browser
 */
app.get('/static/:album', auth.isAuthenticated, function(req, res) {
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


/**
 * GET /files/:id
 * Detailed information about a file
 */
app.get('/files/:id', auth.isAuthenticated, function(req, res) {
  File.findOne({ _id: req.params.id }, function(err, file) {
    if (err) {
      console.error(err);
      return res.send(500, 'Error retrieving a file');
    }
    if (file) {
      var downloadUrl = '/' + file.path;
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


/**
 * DEL /files/:id
 * Deletes a file for a given user from the detail page
 */
app.del('/files/:id', auth.isAuthenticated, function(req, res) {
  File.findById(req.params.id, function(err, file) {
    if (err) {
      console.error(err);
      req.flash('info', 'Could not process delete request');
      return res.redirect('files/' + req.params.id);
    }
    file.remove(function(err) {
      req.flash('info', 'File has been deleted');
      res.send(200, 'OK');
    });
  });
});


// Starts the express application
app.listen(PORT, IP_ADDRESS, function() {
  console.log('Express server started listening on %s:%d', IP_ADDRESS, PORT);
});


// Ignore unhandled errors
process.on('uncaughtException', function(err) {
  console.error(err);
});
