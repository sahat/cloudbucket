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

  // Inline popups
  

  // if not shown, show the menu popup
  $('.menu-popup-button').click(function() {
    if ($('#menu').hasClass('mfp-hide')) {
      $.magnificPopup.open(
      {
        items: {
          type: 'inline',
          src: $('.menu-popup')
        },
        fixedContentPos: true,
        showCloseBtn: false,
        removalDelay: 400,
        mainClass: 'mfp-move-from-top'
      });
    } else {
      $.magnificPopup.close();
    }
  });
});