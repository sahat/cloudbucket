define(['index'], function() {
  var models = require('models');

  describe('Index Route', function() {

    describe('Hammer.js', function() {
      it('should be initialized on "#scroller li"', function() {
        var sample = new models.Sample();
        sample.urlRoot.should.equal('/api/samples');
      });
    });

  });

});