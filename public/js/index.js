define(['jquery', 'hammer'], function($) {
  var hammertime = $('#scroller li').hammer();
  hammertime.on('hold', function(ev) {
    var id = $(ev.currentTarget).data('id');
    vex.dialog.confirm({
      message: 'Delete this file?',
      callback: function(value) {
        if (value) {
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