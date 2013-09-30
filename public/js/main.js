requirejs.config({
  baseUrl: 'js',
  paths: {
    jquery: 'lib/jquery',
    spin: 'lib/spin',
    tooltip: 'lib/tooltip',
    hammer: 'lib/jquery.hammer',
    easypiechart: 'lib/jquery.easypiechart',
    tagsinput: 'lib/jquery.tagsinput',
    knob: 'lib/jquery.knob',
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
    'easypiechart': ['jquery'],
    'tagsinput': ['jquery'],
    'hammer': ['jquery'],
    'knob': ['jquery'],
    'magnific': ['jquery'],
    'raty': ['jquery'],

    'fastclick': {
      exports: 'FastClick'
    },
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
  'detail-book',
  'login',
  'search'
], function() {
  console.log('All modules have been loaded.');
});