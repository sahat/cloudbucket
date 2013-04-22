/**
 * Mongoose Schema for MongoDB
 */
var mongoosastic = require('mongoosastic'),
    mongoose = require('mongoose');

// File schema
exports.File = mongoose.model('File', new mongoose.Schema({
  name: String,
  filetype: String,
  size: Number,
  path: String,
  lastAccessed: Date,
  lastModified: Date,
  keywords: [String],
  summary: String
}).plugin(mongoosastic));

// User schema
exports.User = mongoose.model('User', new mongoose.Schema({
  fbId: {
    type: String,
    index: {
      unique: true
    }
  },
  accessToken: String,
  name: {
    full: String,
    first: String,
    last: String
  },
  link: String,
  username: String,
  gender: String,
  email: String,
  timezone: String,
  locale: String,
  verified: Boolean,
  updatedTime: String
}));
