var async = require('async'),
    config = require('./config'),
    AlchemyAPI = require('alchemy-api');

var alchemy = new AlchemyAPI(config.ALCHEMY);

module.exports = function(text, cb) {
  
  async.parallel({
    entities: function(callback){
      alchemy.entities(text, {}, function(err, response) {
        console.info(response);
        if (err) console.error('entities', err);
        var entities = response ? response.entities : [];
        callback(null, entities);
      });
    },
    category: function(callback) {
      alchemy.category(text, {}, function(err, response) {
        console.info(response);
        if (err) console.error('category', err);
        var category = response ? response.category : '';
        callback(null, category);
      });
    },
    concepts: function(callback) {
      alchemy.concepts(text, {}, function(err, response) {
        console.info(response);
        if (err) console.error('concepts', err);
        var concepts = response ? response.concepts : [];
        callback(null, concepts);
      });
    },
    keywords: function(callback) {
      alchemy.keywords(text, {}, function(err, response) {
        console.info(response);
        if (err) console.error('keywords', err);
        var keywords = response ? response.keywords : [];
        callback(null, keywords);
      });
    }
  },
  function(err, results) {
    cb(results);
  });
}