define(['jquery', 'ladda', 'spin', 'humane', 'tagsinput'], function($, Ladda, humane) {
  console.log('Loading upload.');

  $('#browse').click(function() {
    console.log('click');
    $('input[id=userFile]').click();
  });

  $('input[id=userFile]').change(function() {
    var path = $(this).val();
    var fileName = path.split('\\') || path.split('/');
    if (fileName.length > 0) {
      $('#uploadField').val(fileName.slice(-1)[0]);
    } else {
      $('#uploadField').val(path);
    }
  });

  var uploadDevice = 'PC';

  var isMobile = {
    Android: function() {
      return navigator.userAgent.match(/Android/i) ? true : false;
    },
    BlackBerry: function() {
      return navigator.userAgent.match(/BlackBerry/i) ? true : false;
    },
    iOS: function() {
      return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
    },
    Windows: function() {
      return navigator.userAgent.match(/IEMobile/i) ? true : false;
    },
    any: function() {
      return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
    }
  };

  if (isMobile.Android()) {
    uploadDevice = 'Android';
  } else if (isMobile.BlackBerry()) {
    uploadDevice = 'BlackBerry';
  } else if (isMobile.iOS()) {
    uploadDevice = 'iOS';
  } else if (isMobile.Windows()) {
    uploadDevice = 'Windows Phone';
  }

  var input = $('<input>').attr('type', 'hidden').attr('name', 'uploadDevice').val(uploadDevice);
  $('#uploadForm').append($(input));

  $('#tags').tagsInput({
    'width': '100%'
  });

  Ladda.bind('button[type=submit]', {
    callback: function(instance) {
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