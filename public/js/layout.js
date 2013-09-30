define(['jquery', 'iscroll', 'snap', 'fastclick'], function($, IScroll, Snap, FastClick) {
  console.log('Loading layout.');

  // Login page is not using IScroll #wrapper element
  try {
      var myScroll = new IScroll('#wrapper', {
      mouseWheel: true,
      click: true
    });
  }
  catch(e) {
    // Do nothing
  }

  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

  // Initialize Fastclick to remove 0.3s delay on tap
  FastClick.attach(document.body);

  var snapper = new Snap({
    element: document.getElementById('content'),
    disable: 'right',
    tapToClose: true,
    touchToDrag: false
  });

  // Login page does not have a Menu button
  try {
    document.getElementById('snap').onclick = function() {
      if (snapper.state().state === 'left') {
        snapper.close();
      } else {
        snapper.open('left');
      }
    }
  }
  catch(e) {
    // Do nothing
  }
});