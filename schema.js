/**
 * Mongoose Schema for MongoDB
 */
var mongoose = require('mongoose');

// File schema
// 
// 1-to-1 onto function between user and files
exports.File = new mongoose.Schema({
  // general
  name: String,
  extension: String,
  contentType: String,
  size: Number,
  friendlySize: String,
  path: String,
  ETag: String,
  tags: Array,
  uploadDevice: String,

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
  albumCover: [{
    format: String,
    data: Buffer
  }],
  albumCovers: Array,
  trackDuration: Number,
  lastFmTags: Array,
  artistImages: Array,
  artistBio: String,
  similarArtists: Array,
  trackId: Number,
  artistId: Number,
  albumId: Number,
  lyrics: String,

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
  videoDuration: String,
  videoBitrate: Number,
  videoCodec: String,
  videoResolution: {
    w: String,
    h: String
  },
  videoFps: String,
  videoAudioCodec: String,
  videoAudioBitrate: Number,
  videoAudioSampleRate: Number
});

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

  diskUsage: { type: Number, default: 0 },
  diskQuota: { type: Number, default: 2147483648 }
}));