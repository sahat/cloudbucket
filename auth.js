var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('./schema').User;
var config = require('./config.json');

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