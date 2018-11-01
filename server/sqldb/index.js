/**
 * Sequelize initialization module
 */

'use strict';

var path = require('path');
var config = require('../config/environment');

var Sequelize = require('sequelize');

var db = {
   Sequelize: Sequelize,
   sequelize: new Sequelize(config.sequelize.uri, config.sequelize.options)
};

function importModel(name) {
   return db.sequelize.import(path.join(
      config.root,
      'server',
      'sqldb',
      'model',
      name
   ));
}

// Insert models below
var World        = db.World        = importModel('world');
var User         = db.User         = importModel('user');

// Put in special hooks
function hookSetter(Model, property) {
   var original = Model.Instance.prototype['set' + property.ucwords()];

   Model.Instance.prototype['set' + property.ucwords()] = function(associatedInstance, options) {
      this[property] = associatedInstance;

      return original.apply(this, arguments);
   }
}

// Set up auto ID generation
function autogenerate_ids(Model, field) {
   Model.options.hooks.beforeValidate = function(instance) {
      if (!instance.getDataValue('_id')) {
         instance.setDataValue('_id', Math.floor(Math.random() * 99999999));
      }
   };

   Model.options.hooks.beforeBulkCreate = function(instances) {
      var promise;

      for (var i = instances.length - 1; i >= 0; i--) {
         (function(instance) {
            if (promise) {
               promise.then(function() {
                  return instance.Model.runHooks('beforeValidate', instance);
               });
            }
            else {
               promise = instance.Model.runHooks('beforeValidate', instance);
            }
         })(instances[i]);
      };

      return promise;
   };
};

autogenerate_ids(User, '_id');

module.exports = db;
