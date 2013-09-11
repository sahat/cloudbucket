/**
 * Mongoose Schema for MongoDB
 */
var mongoosastic = require('mongoosastic'),
    mongoose = require('mongoose'),
    config = require('./config');


// File schema
var File = new mongoose.Schema({
  name: { type: String, required: true },
  extension: String,
  type: String,
  size: Number,
  friendlySize: String,
  path: String,
  lastModified: Date,
  isFolder: Boolean,

  keywords: Array,
  category: String,
  concepts: Array,
  entities: Array,
  summary: String,
  user: String,

  genre: Array,
  title: String,
  artist: Array,
  albumArtist: Array,
  year: Date,
  album: String,
  albumCover: Buffer
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
  verified: Boolean
}));