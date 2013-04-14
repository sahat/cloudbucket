/**
 * Mongoose Schema for MongoDB
 */
var mongoose = require('mongoose');

// file schema
exports.file = new mongoose.Schema({
  name: String,
  filetype: String,
  size: Number,
  location: String,
  lastAccessed: Date,
  lastModified: Date,
  keywords: [String],
  summary: String
});

// user schema
exports.user = new mongoose.Schema({
  userName: { type: String, required: true, index: { unique: true } },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  joinedOn: { type: Date, default: Date.now() },
  publicKey: String
});

