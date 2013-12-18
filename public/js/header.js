define(['jquery'], function($) {
  console.log('Loading header.');

  // click on the search button
  $('#search').click(function() {
    $('#search-header').show().find('input').focus();
  });

  // click on the cancel button
  $('.input-group-btn').click(function() {
    $('#search-header').hide();
  });

});