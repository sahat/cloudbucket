/**
 * Mongoose Schema for MongoDB
 */
var mongoosastic = require('mongoosastic'),
    mongoose = require('mongoose'),
    config = require('./config');


// File schema
var File = new mongoose.Schema({
  name: String,
  extension: String,
  type: String,
  size: Number,
  path: String,
  lastModified: Date,
  keywords: [String],
  summary: String,
  user: String
});

File.plugin(mongoosastic);

exports.File = File;

// User schema
exports.User = mongoose.model('User', new mongoose.Schema({
  googleId: {
    type: String,
    index: {
      unique: true
    }
  },
  accessToken: String,
  displayName: String,
  link: String,
  picture: String,
  gender: String,
  email: String,
  locale: String,
  verified: Boolean
}));
