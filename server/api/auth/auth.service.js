'use strict';

var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var compose = require('composable-middleware');
var validateJwt = expressJwt({
  secret: config.secrets.session
});
var sqldb = require('../../sqldb');

module.exports = (function() {
  var User = sqldb.User;

  /**
   * Attaches the user object to the request if authenticated
   * Otherwise returns 403
   */
  function isAuthenticated() {
    return compose()
      // Validate jwt
      .use(function(req, res, next) {
        // allow access_token to be passed through query parameter as well
        if (req.query && req.query.hasOwnProperty('access_token')) {
          req.headers.authorization = 'Bearer ' + req.query.access_token;
        }
        return validateJwt(req, res, next);
      })
      // Attach user to request
      .use(function(err, req, res, next) {
        if (err.name === 'UnauthorizedError') {
          res.status(401).json({ message: 'Invalid Token' });
          return;
        }
      })
      .use(function(req, res, next) {

        return User.find({
          where: {
            _id: req.user._id
          }
        })
          .then(function(user) {
            if (!user) {
              return res.status(401).end();
            }
            req.user = user;
            next();
            return null;
          })
          .catch(function(err) {
            return next(err);
          });
      });
  }

  /**
   * Checks if the user role meets the minimum requirements of the route
   */
  function hasRole(roleRequired) {
    if (!roleRequired) {
      throw new Error('Required role needs to be set');
    }

    return compose()
      .use(isAuthenticated())
      .use(function meetsRequirements(req, res, next) {
        if (config.userRoles.indexOf(req.user.role) >=
            config.userRoles.indexOf(roleRequired)) {
          next();
        }
        else {
          res.send(403);
        }
      });
  }

  /**
   * Returns a jwt token signed by the app secret
   */
  function signToken(id) {
    return jwt.sign({ _id: id }, config.secrets.session, {
      expiresIn: 60 * 60 * 5
    });
  }

  /**
   * Set token cookie directly for oAuth strategies
   */
  function setTokenCookie(req, res) {
    if (!req.user) {
      return res.json(404, {
        message: 'Something went wrong, please try again.'
      });
    }
    var token = signToken(req.user._id, req.user.role);
    res.cookie('token', JSON.stringify(token));
    res.redirect('/');
  }

  var exports = {};

  exports.isAuthenticated = isAuthenticated;
  exports.hasRole = hasRole;
  exports.signToken = signToken;
  exports.setTokenCookie = setTokenCookie;

  return exports;
})();