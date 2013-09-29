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
    vex: 'lib/vex.combined.min',
    iscroll: 'lib/iscroll-lite-min'
  },

  shim: {
    'tooltip': {
      deps: ['jquery']
    },
    'easypiechart': {
      deps: ['jquery']
    },
    'tagsinput': {
      deps: ['jquery']
    },
    'knob': {
      deps: ['jquery']
    },
    'magnific': {
      deps: ['jquery']
    },
    'raty': {
      deps: ['jquery']
    },
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

// It will load app/js/app.js
require(['app', 'layout', 'header', 'index'], function() {
  console.info('App loaded');
});