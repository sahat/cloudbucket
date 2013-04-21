exports.authenticate = function(req, res, next) {
  if (req.session.auth) {
    next();
  } else {
    res.send(403, { error: 'You are not authorized to make requests to this server.' });
  }
};