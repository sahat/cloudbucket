/**
 * Mongoose Schema for MongoDB
 */
var mongoose = require('mongoose');
var mongoosastic = require('mongoosastic');

// File schema
exports.file = new mongoose.Schema({
  name: String,
  filetype: String,
  size: Number,
  path: String,
  lastAccessed: Date,
  lastModified: Date,
  keywords: [String],
  summary: String
}).plugin(mongoosastic);

// User schema
exports.user = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true },
  joinedOn: { type: Date, default: Date.now() }
});