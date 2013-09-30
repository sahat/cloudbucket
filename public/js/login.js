define(['jquery', 'swiper'], function($, Swiper) {
  console.log('Loading login page');


  //Function to Fix Pages Height
  function fixPagesHeight() {
    $('.swiper-container').css({
      height: $(window).height(),
      width: $('.container').width()
    })
  }

  $(window).on('resize',function(){
    fixPagesHeight()
  });

  fixPagesHeight();

  var mySwiper = new Swiper('.swiper-container', {
    pagination: '.pagination',
    loop:true,
    grabCursor: true,
    paginationClickable: true
  });

  // Display a loading icon until DOM is ready
  $('.loader').hide();
  $('.container').css('visibility', 'visible');

  // Change page background to white
  $('#content').css('background', '#fff');

  // Display a loading state on sign-in button
  $('a[data-loading-text]').click(function() {
    $(this).removeClass('is-primary').addClass('is-success').text('Signing in...');
  });

});