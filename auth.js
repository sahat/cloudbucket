var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;


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
    process.nextTick(function () {
      User.findOne({ 'googleId': profile.id }, function(err, existingUser) {
        if (existingUser) return done(null, existingUser);
        var user = new User({
          googleId: profile.id,
          accessToken: accessToken,
          displayName: profile.displayName,
          link: profile._json.link,
          picture: profile._json.picture,
          gender: profile._json.gender,
          email: profile._json.email,
          locale: profile._json.locale,
          verified: profile._json.verified_email,
          isAdmin: userCount < 1
        });
        user.save(function(err) {
          if (err) {
            console.error(err);
          }
          done(null, user);
        });
      });
    });
  }
));