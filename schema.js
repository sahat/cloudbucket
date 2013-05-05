/**
 * Mongoose Schema for MongoDB
 */
var mongoosastic = require('mongoosastic'),
    mongoose = require('mongoose');


// File schema
exports.File = mongoose.model('File', new mongoose.Schema({
  name: String,
  extension: String,
  type: String,
  size: Number,
  path: String,
  lastModified: Date,
  keywords: [String],
  summary: String
}).plugin(mongoosastic));


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
