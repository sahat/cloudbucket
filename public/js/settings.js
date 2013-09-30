define(['jquery'], function($) {
  console.log('Loading settings page.');

  // Delete user confirmation alert
  $('#delete-account').click(function() {
    var answer = confirm('Are you sure you want to delete the user?');
    var user = $(this).data('user');

    if (answer) {
      $.ajax({
        url: '/admin/users/' + user,
        type: 'DELETE',
        success: function(result) {
          console.log(result);
        }
      });
    }
  });

});