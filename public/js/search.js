define(['search'], function() {
  console.log('Loading search page');

  $('.thumb').click(function() {
    $(this).addClass('tada animated');
    var categoryType = $(this).data('type');
    window.location = '/search/category/' + categoryType;
  });
});