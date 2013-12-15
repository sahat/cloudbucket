var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model('User', userSchema);
