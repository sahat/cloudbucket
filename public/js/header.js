define(['jquery', 'headroom'], function($) {
  console.log('Loading header.');

  $('#header').headroom();

  // click on the search button
  $('#search').click(function() {
    $('#search-header').show().find('input').focus();
  });

  // click on the cancel button
  $('.input-group-btn').click(function() {
    $('#search-header').hide();
  });

});