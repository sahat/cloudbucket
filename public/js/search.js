define(['search'], function() {
  console.log('Loading search page');

  $('.thumb').click(function() {
    $(this).addClass('tada animated');
    var categoryType = $(this).data('type');
    $.post('/search/category', { categoryType: categoryType }, function() {
      console.log('Success POST for category search');
    });
  });

  var isMobile = {
    Android: function() {
      return navigator.userAgent.match(/Android/i) ? true : false;
    },
    BlackBerry: function() {
      return navigator.userAgent.match(/BlackBerry/i) ? true : false;
    },
    iOS: function() {
      return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
    },
    Windows: function() {
      return navigator.userAgent.match(/IEMobile/i) ? true : false;
    },
    any: function() {
      return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
    }
  };

  console.log((isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows()));

});