define(['jquery', 'vex', 'vexDialog', 'animateCSS'], function($, vex, vexDialog) {

  var id = $('#delete-file').data('id');

  $('#delete-file').click(function() {
    vex.defaultOptions.className = 'vex-theme-os';

    vexDialog.confirm({
      message: 'Are you sure you want to delete this file?',
      callback: function(value) {
        if (value) {
          $.ajax({
            type: 'DELETE',
            url: '/files/' + id,
            success: function() {
              console.log('File has been deleted');
              location.href = '/';
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