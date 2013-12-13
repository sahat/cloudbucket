var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('./schema').User;

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// TODO: username is email
passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if (!user) return done(null, false, { message: 'No match found for user: ' + username });
    user.comparePassword(password, function(err, isMatch) {
      if(isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Your username or password is incorrect' });
      }
    });
  });
}));

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