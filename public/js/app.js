$(document).ready(function() {

  $('.upload-popup-link').magnificPopup({
    type: 'inline',
    fixedContentPos: false,
    fixedBgPos: true,
    overflowY: 'auto',
    closeBtnInside: true,
    preloader: false,
    midClick: true,
    removalDelay: 300,
    mainClass: 'my-mfp-zoom-in'
  });

  // $('.menu-popup-button').magnificPopup({
  //   type: 'inline',
    
  // });
  $('.menu-popup-button').click(function() {
    
    if (!$('#menu').hasClass('mfp-hide')) {
      return $.magnificPopup.close();
    }
    
    $.magnificPopup.open({
      items: {
        src: $('#menu'),
        type: 'inline'
      },
      fixedContentPos: true,
      fixedBgPos: true,
      preloader: false,
      overflowY: 'hidden',
      showCloseBtn: false,
      removalDelay: 400,
      mainClass: 'mfp-move-from-top'
    });
  });
  

  
});