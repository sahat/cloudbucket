define(['jquery', 'vex', 'vexDialog', 'humane', 'hammer', 'animateCSS'], function($, vex, vexDialog, humane) {
  console.log('loading index.');

  var $message = $('#message').data('message');
  if ($message && $message !== 'undefined') {
    humane.log($message);
  }

  $('.inner').click(function() {
    $(this).find('.file-loader').show();
    $(this).removeClass('selected');
    $(this).find('a')[0].click();
  });

  var hammertime = $(".inner").hammer();


  hammertime.on('touch', function(ev) {
    $(this).addClass('selected');
  });
  hammertime.on('release', function(ev) {
    $(this).find('.file-loader').show();
    $(this).removeClass('selected');
    $(this).find('a')[0].click();
  });

  hammertime.on('dragstart', function(ev) {
    ev.gesture.stopDetect(); // stop release event firing
    ev.preventDefault();
    $(this).removeClass('selected');
  });
});