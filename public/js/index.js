define(['jquery', 'vex', 'vexDialog', 'humane', 'hammer', 'animateCSS'], function($, vex, vexDialog, humane) {
  console.log('loading index.');

  var $message = $('#message').data('message');
  if ($message && $message !== 'undefined') {
    humane.log($message);
  }

  var hammertime = $(".inner").hammer();


  hammertime.on('release', function(ev) {
    console.log('touch released');
    $(this).find('.file-loader').show();
    $(this).find('a')[0].click();
  });

  hammertime.on('dragstart', function(ev) {
    console.log('starting drag event');
    ev.gesture.stopDetect(); // stop release event firing
    ev.preventDefault();
  });

});