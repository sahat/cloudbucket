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

  $('.menu-popup-button').magnificPopup({
    type: 'inline',
    fixedContentPos: false,
    fixedBgPos: true,
    preloader: false,
    overflowY: 'auto',
    showCloseBtn: false,
    removalDelay: 300,
    mainClass: 'mfp-move-from-top'
  });
  
});