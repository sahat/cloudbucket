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
  $('.menu-popup-button').magnificPopup({
    type: 'inline',
    removalDelay: 500,
    mainClass: 'mfp-move-from-top',
    midClick: true
  });

});