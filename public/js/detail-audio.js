define(['audiojs'], function(audiojs) {
  console.log('Loading detail audio.');

  audiojs.events.ready(function() {
    var as = audiojs.createAll();
  });
});