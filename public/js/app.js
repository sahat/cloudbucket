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

var ModalEffects = (function() {

	function init() {

		var overlay = document.querySelector( '.md-overlay' );

		[].slice.call( document.querySelectorAll( '.md-trigger' ) ).forEach( function( el, i ) {

			var modal = document.querySelector( '#' + el.getAttribute( 'data-modal' ) ),
				close = modal.querySelector( '.md-close' );

			function removeModal( hasPerspective ) {
				classie.remove( modal, 'md-show' );

				if( hasPerspective ) {
					classie.remove( document.documentElement, 'md-perspective' );
				}
			}

			function removeModalHandler() {
				removeModal( classie.has( el, 'md-setperspective' ) ); 
			}

			el.addEventListener( 'click', function( ev ) {
				classie.add( modal, 'md-show' );
				overlay.removeEventListener( 'click', removeModalHandler );
				overlay.addEventListener( 'click', removeModalHandler );

				if( classie.has( el, 'md-setperspective' ) ) {
					setTimeout( function() {
						classie.add( document.documentElement, 'md-perspective' );
					}, 25 );
				}
			});

			close.addEventListener( 'click', function( ev ) {
				ev.stopPropagation();
				removeModalHandler();
			});

		} );

	}

	init();

})();