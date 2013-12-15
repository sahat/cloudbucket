var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('./models/User');
var config = require('./config');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy(config.google, function(req, accessToken, refreshToken, profile, done) {
  User.findOne({ 'googleId': profile.id }, function(err, existingUser) {
    if (existingUser) return done(null, existingUser);
    var user = new User();
    user.googleId = profile.id;
    user.accessToken = accessToken;
    user.displayName = profile.displayName;
    user.link = profile._json.link;
    user.picture = profile._json.picture;
    user.email = profile._json.email;
    user.save(function(err) {
      done(err, user);
    });
  });
}));

// Simple route middleware to ensure user is authenticated.
// Use this route middleware on any resource that needs to be protected.  If
// the request is authenticated (typically via a persistent login session),
// the request will proceed.  Otherwise, the user will be redirected to the
// login page.
exports.isAuthenticated = function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}