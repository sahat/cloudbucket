requirejs.config({
  paths: {
    jquery: 'lib/jquery',
    spin: 'lib/spin',
    tooltip: 'lib/tooltip',
    hammer: 'lib/jquery.hammer',
    tagsinput: 'lib/jquery.tagsinput',
    magnific: 'lib/jquery.magnific-popup',
    raty: 'lib/jquery.raty',
    fastclick: 'lib/fastclick',
    humane: 'lib/humane',
    snap: 'lib/snap',
    swiper: 'lib/idangerous.swiper-2.2',
    ladda: 'lib/ladda.min',
    vex: 'lib/vex',
    vexDialog: 'lib/vex.dialog',
    iscroll: 'lib/iscroll',
    animateCSS: 'lib/animateCSS',
    domReady: 'lib/ready'
  },

  shim: {
    'animateCSS': ['jquery'],
    'tooltip': ['jquery'],
    'tagsinput': ['jquery'],
    'hammer': ['jquery'],
    'magnific': ['jquery'],
    'raty': ['jquery'],

    'humane': {
      exports: 'humane'
    },
    'snap': {
      exports: 'Snap'
    },
    'swiper': {
      exports: 'Swiper'
    },
    'ladda': {
      exports: 'Ladda'
    },
    'iscroll': {
      exports: 'IScroll'
    }
  }
});

// Main libraries
require([
  'header',
  'layout',
  'index',
  'upload',
  'admin',
  'detail',
  'detail-text',
  'detail-book',
  'login',
  'search'
], function() {
  console.log('All modules have been loaded.');
});