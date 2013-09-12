var async = require('async'),
    config = require('./config'),
    AlchemyAPI = require('alchemy-api');

var alchemy = new AlchemyAPI(config.ALCHEMY);

module.exports = function(params, cb) {
  
  var text = params;

  async.parallel({
    entities: function(callback){
      alchemy.entities(text, {}, function(err, response) {
        var entities = response.entities;
        callback(err, entities);
      });
    },
    category: function(callback) {
      alchemy.category(text, {}, function(err, response) {
        var category = response.category;
        callback(err, category);
      });
    },
    concepts: function(callback) {
      alchemy.concepts(text, {}, function(err, response) {
        var concepts = response.concepts;
        callback(err, concepts);
      });
    },
    keywords: function(callback) {
      alchemy.keywords(text, {}, function(err, response) {
        var keywords = response.keywords;
        callback(err, keywords);
      });
    }
  },
  function(err, results) {
    if (err) throw err;
    cb(results);
  });
}