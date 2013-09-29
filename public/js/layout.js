define(['iscroll', 'snap', 'fastclick'], function(IScroll, Snap, FastClick) {
  console.log('Loading layout.');



  window.addEventListener('load', function() {
    FastClick.attach(document.body);
  }, false);

  var snapper = new Snap({
    element: document.getElementById('content'),
    disable: 'right',
    tapToClose: true,
    touchToDrag: false
  });


  $('#snap').click(function() {
    if (snapper.state().state === 'left') {
      snapper.close();
    } else {
      snapper.open('left');
    }
  });
});