define(['jquery', 'iscroll', 'snap'], function($, IScroll, Snap) {
  var myScroll = new IScroll('#wrapper', {
    bounceEasing: 'elastic',
    bounceTime: 1500,
    mouseWheel: true,
    click: true
  });
  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);


  window.addEventListener('load', function() {
    FastClick.attach(document.body);
  }, false);

  var snapper = new Snap({
    element: document.getElementById('content'),
    disable: 'right',
    tapToClose: true,
    touchToDrag: true
  });


  $('#snap').click(function() {
    if (snapper.state().state === 'left') {
      snapper.close();
    } else {
      snapper.open('left');
    }
  });
});