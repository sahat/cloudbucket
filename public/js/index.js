define(['jquery', 'vex', 'vexDialog', 'hammer', 'animateCSS'], function($, vex, vexDialog) {
  console.log('Loading index.');

  var hammertime = $('#scroller li').hammer();

  hammertime.on('hold', function(ev) {

    var target = $(ev.currentTarget);
    var id = $(ev.currentTarget).data('id');

    vex.defaultOptions.className = 'vex-theme-os';
    vexDialog.confirm({
      message: 'Are you sure you want to delete this file?',
      callback: function(value) {
        if (value) {

          // remove from DOM
          target.animateCSS('fadeOutDown', function() {
            target.hide();
          });

          $.ajax({
            type: 'DELETE',
            url: '/files/' + id,
            success: function() {
              console.log('File has been deleted');



            },
            error: function(xhr, status, error) {
              console.log(status, error);
            }
          });
        } else {
          console.log('Selected false');
        }
      }
    });
  });
});