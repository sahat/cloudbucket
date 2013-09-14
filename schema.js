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
  name: { type: String, required: true },
  extension: String,
  type: String,
  size: Number,
  friendlySize: String,
  path: String,
  tags: Array,

  // document
  keywords: Array,
  category: String,
  concepts: Array,
  entities: Array,
  //preview: String,
  user: String,

  // mp3
  genre: Array,
  title: String,
  artist: Array,
  albumArtist: Array,
  year: Date,
  album: String,
  albumCover: mongoose.Schema.Types.Mixed
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