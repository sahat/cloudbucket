define(['humane'], function(humane) {
  console.log('Loading search page');

  var message = $('#message').data('message');

  if (message) {
    humane.log(message);
  }

  $('.thumb').click(function() {
    $(this).addClass('tada animated');
    var categoryType = $(this).data('type');
    window.location = '/search/category/' + categoryType;
  });
});