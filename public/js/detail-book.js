define(['jquery', 'raty'], function($) {
  console.log('Loading detail page for a book.');

  var $star = $('#star');
  $star.raty({
    score: $star.data('rating'),
    readOnly: true,
    width: false,
    path: '../img'
  });

});