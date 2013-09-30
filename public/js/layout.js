define(['iscroll', 'snap', 'fastclick'], function(IScroll, Snap, FastClick) {
  console.log('Loading layout.');

  FastClick.attach(document.body);

  var snapper = new Snap({
    element: document.getElementById('content'),
    disable: 'right',
    tapToClose: true,
    touchToDrag: false
  });

  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

  document.getElementById('snap').onclick = function() {
    if (snapper.state().state === 'left') {
      snapper.close();
    } else {
      snapper.open('left');
    }
  }
});