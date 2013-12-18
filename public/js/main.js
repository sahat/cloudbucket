requirejs.config({
  paths: {
    jquery: 'lib/jquery',
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
    spin: 'lib/spin',
    vex: 'lib/vex',
    vexDialog: 'lib/vex.dialog',
    iscroll: 'lib/iscroll',
    animateCSS: 'lib/animateCSS',
    domReady: 'lib/ready',
    audiojs: 'lib/audiojs/audio.min',
    headroom: 'lib/headroom'
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
    },
    'audiojs': {
      exports: 'audiojs'
    },
    'headroom': {
      exports: 'Headroom'
    }
  },
  urlArgs: "bust=" +  (new Date()).getTime()
});

// Main libraries
require([
  'header',
  'footer',
  'layout',
  'index',
  'upload',
  'admin',
  'detail',
  'detail-audio',
  'detail-text',
  'detail-book',
  'login',
  'search',
  'settings'
], function() {
  console.log('All modules have been loaded.');
});