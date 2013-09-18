/**
 * Mongoose Schema for MongoDB
 */
var mongoosastic = require('mongoosastic'),
    mongoose = require('mongoose');

// File schema
// 
// 1-to-1 onto function between user and files
var File = new mongoose.Schema({
  // general
  name: String,
  extension: String,
  contentType: String,
  size: Number,
  friendlySize: String,
  path: String,
  ETag: String,
  tags: Array,

  // document
  keywords: Array,
  category: String,
  concepts: Array,
  entities: Array,
  //preview: String,
  user: String,

  //epub book
  bookTitle: String,
  bookAuthor: String,
  bookPublishedDate: String,
  bookDescription: String,
  bookPageCount: Number,
  bookCategory: String,
  bookAverageRating: String,
  bookCover: String,

  // mp3
  genre: Array,
  title: String,
  artist: Array,
  albumArtist: Array,
  year: String ,
  album: String,
  albumCover: String,
  trackDuration: Number,
  lastFmTags: Array,
  artistImages: Array,
  artistBio: String,
  similarArtists: Array,

  // image
  width: Number,
  height: Number,
  recognizable: Boolean,
  yaw: Number,
  roll: Number,
  pitch: Number,
  face: {
    value: String,
    confidence: Number
  },
  gender: {
    value: String,
    confidence: Number
  },
  glasses: {
    value: String,
    confidence: Number
  },
  smiling: {
    value: String,
    confidence: Number
  },

  // video
  aspectRatio: Number,
  videoCodec: String,
  audioCodec: String
});

File.plugin(mongoosastic);

exports.File = File;

// User schema
exports.User = mongoose.model('User', new mongoose.Schema({
  googleId: { type: String, index: { unique: true } },
  accessToken: String,
  displayName: String,
  link: String,
  picture: String,
  gender: String,
  email: String,
  locale: String,
  verified: Boolean,
  isAdmin: Boolean,


  diskUsage: { type: Number, default: 0 }, // 0 bytes
  diskQuota: { type: Number, default: 1073741824 } // 1GB in bytes
}));