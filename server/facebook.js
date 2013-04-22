exports.authenticate = function(req, res, next) {
  if (req.session.auth) {
    next();
  } else {
    res.send(403, { error: 'You are not authenticated with Facebook' });
  }
};
