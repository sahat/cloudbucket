define(['iscroll', 'snap', 'fastclick'], function(IScroll, Snap, FastClick) {
  console.log('Loading layout.');

  var myScroll = new IScroll('#wrapper', {
    bounceEasing: 'elastic',
    bounceTime: 1500,
    mouseWheel: true,
    click: true
  });
  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

  FastClick.attach(document.body);

  var snapper = new Snap({
    element: document.getElementById('content'),
    disable: 'right',
    tapToClose: true,
    touchToDrag: false
  });

  document.getElementById('snap').onclick = function() {
    if (snapper.state().state === 'left') {
      snapper.close();
    } else {
      snapper.open('left');
    }
  }
});