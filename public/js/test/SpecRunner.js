require.config({
  paths: {
    jquery: '../lib/jquery',
    mocha: 'libs/mocha',
    chai: 'libs/chai',
    chai$: 'libs/chai-jquery',

    index: '../index'
  },

  shim: {
    'chai$': {
      deps: ['jquery']
    }
  },

  urlArgs: "v="+(new Date()).getTime()
});

require(['chai', 'chai$', 'mocha', 'jquery'], function(chai, chai$) {

  var assert = chai.assert;
  var should = chai.should();
  var expect = chai.expect;

  chai.use(chai$);

  mocha.setup('bdd');

  require(['specs/array-test'], function() {
    mocha.run();
  });

});