define(['search'], function() {
  console.log('Loading search page');

  $('.thumb').click(function() {
    $(this).addClass('tada animated');
    var categoryType = $(this).data('type');

    $.post('/search/category', { categoryType: categoryType }, function() {
      console.log('Success POST for category search');
    });
  });




});