requirejs.config({
  baseUrl: 'js',

  paths: {
    jquery: 'lib/jquery'
  },

  shim: {
    'lib/tooltip': ['jquery'],
    'lib/jquery.hammer': ['jquery'],
    'lib/jquery.easypiechart': ['jquery'],
    'lib/jquery.tagsinput': ['jquery'],
    'lib/jquery.knob': ['jquery'],
    'lib/jquery.magnific-popup': ['jquery'],
    'lib/jquery.raty': ['jquery'],

    'lib/fastclick': {
      exports: 'FastClick'
    },
    'lib/humane': {
      exports: 'humane'
    },
    'lib/snap': {
      exports: 'Snap'
    },
    'lib/idangerous.swiper-2.2': {
      exports: 'Swiper'
    },
    'lib/ladda.min': {
      exports: 'Ladda'
    },
    'lib/vex.combined.min': {
      exports: 'vex'
    },
    'lib/iscroll-lite-min': {
      exports: 'IScroll'
    }
  }
});

// It will load app/js/app.js
require(['app'], function(App) {
  window.bTask = new App();
});