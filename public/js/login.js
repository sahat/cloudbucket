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

  var mySwiper = new Swiper('.swiper-container',{
    pagination: '.pagination',
    loop:true,
    grabCursor: true,
    paginationClickable: true
  });
});