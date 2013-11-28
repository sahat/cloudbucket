define(['jquery'], function($) {
  console.log('Loading footer.');

  var $footerLink = $('#footer a');
  switch (location.pathname) {

    case '/':
      $('#home').addClass('active');
      break;
    case '/upload':
      $('#upload').addClass('active');
      break;
    case '/search':
      $('#search-footer').addClass('active');
      break;
    case '/settings':
      $('#settings').addClass('active');
      break;
  }

});