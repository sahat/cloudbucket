define(['search'], function() {
  console.log('Loading search page');

  $('.thumb').click(function() {
    $(this).addClass('tada animated');
    var categoryType = $(this).data('type');

    $.post('/search/category', { categoryType: categoryType }, function(data) {
      var searchResults = document.open('text/html', 'replace');
      searchResults.write(data);
      searchResults.close();
    });
  });
});