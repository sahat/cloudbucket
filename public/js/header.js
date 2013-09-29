define(['jquery'], function($) {

  $('#search').click(function() {
    $('#search-header').fadeIn(125).find('input').focus();
  });

  $('.input-group-btn').click(function() {
    $('#search-header').fadeOut(125);
  });

});