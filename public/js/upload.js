define(['jquery', 'ladda', 'humane', 'tagsinput'], function($, Ladda, humane) {
  console.log('Loading upload.');

  $('#tags').tagsInput({
    'width': '100%'
  });

  var $message = $('#message').data('message');
  if ($message) {
    humane.log($message);
  }

  Ladda.bind('button[type=submit]', {
    callback: function( instance ) {
      var progress = 0;
      var interval = setInterval( function() {
        progress = Math.min( progress + Math.random() * 0.1, 1 );
        instance.setProgress( progress );

        if( progress === 1 ) {
          instance.stop();
          clearInterval( interval );
        }
      }, 200 );
    }
  } );
});