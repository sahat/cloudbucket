$(document).ready(function() {
  
  // Upload file modal dialog
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
  
  $('[rel=popover]').popover({ 
    html : true,
    placement: 'bottom',
    container: 'body',
    content: function() {
      return $('#popover-content').html();
    }
  });


});