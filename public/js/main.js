requirejs.config({
  baseUrl: 'js',

  paths: {
    jquery: 'lib/jquery',
    spin: 'lib/spin'
  },

  shim: {
    /**
     * jQuery Plugins
     */
    'lib/tooltip': {
      deps: ['jquery']
    },
    'lib/jquery.hammer': {
      deps: ['jquery']
    },
    'lib/jquery.easypiechart': {
      deps: ['jquery']
    },
    'lib/jquery.tagsinput': {
      deps: ['jquery']
    },
    'lib/jquery.knob': {
      deps: ['jquery']
    },
    'lib/jquery.magnific-popup': {
      deps: ['jquery']
    },
    'lib/jquery.raty': {
      deps: ['jquery']
    },

    /**
     * Stand-alone Libraries
     */
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