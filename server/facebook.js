var config = require('./config');

exports.checkSession = function(req, res, next) {

  // Look for the cookie set by Facebook when a user logs in and authorizes an app.
  // The format of the cookie name is 'fbsr_' followed by the Application ID
  var fbCookie = req.cookies['fbsr_' + config.client_id],
      parsedToken,
      base64data;

  // If there's no Facebook cookie, the user is not authorized.
  if (!fbCookie) return res.send('No facebook cookie detected');

  // The cookie is the same format as a Facebook signed request:
  // https://developers.facebook.com/docs/authentication/signed_request/
  base64data = fbCookie.split('.', 2);
  parsedToken = JSON.parse(new Buffer(base64data[1], 'base64').toString('ascii'));

  // If we already have a Facebook session saved, and the User ID and Auth Code match those
  // that are in the Facebook cookie, we can assume we're successfully authenticated with
  // Facebook, and proceed to the next step in the route.
  //
  // We check the user ID and Auth code are the same in case the user has logged out and in on the
  // client side (invalidating the server session) or if there is now a different user logged in
  // on the client side.
  if (req.session.fb && req.session.fb.user_id === parsedToken.user_id && req.session.fb.code === parsedToken.code) {
    next();
  } else {

    // If we don't have a Facebook session saved locally, we'll need to swap the code in our
    // Facebook cookie for an access_token.
    console.log("Found Facebook cookie. Swapping Auth code for access_token...");

    // Save the Facebook user ID and auth code to the session so we can check they are valid
    // in subsequent requests.
    req.session.fb = {
      user_id: parsedToken.user_id,
      code: parsedToken.code
    };

    // Make the call to Facebook to swap our Auth token for an access_token
    graph.authorize({
      "redirect_uri":   "", // Facebook JS SDK sets redirect_uri to ''
      "client_id":      config.client_id,
      "client_secret":  config.client_secret,
      "code":           parsedToken.code
    }, function(err, facebookRes) {

      if (err) {
        handleError('Error obtaining Facebook access_token.', facebookRes, req, res);
        return;
      }

      console.log("Successfully obtained Facebook access_token.");

      // Save the access token to the session, and activate it for the current request.
      req.session.fb.access_token = facebookRes.access_token;

      next();

    });
  }
};