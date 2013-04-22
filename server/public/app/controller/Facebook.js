Ext.define('Semantica.controller.Facebook', {
  extend: 'Ext.app.Controller',

  config: {
    control: {
      '#fbLogin': {
        tap: 'onFacebookLogin'
      }
    }
  },

  init: function() {
    Semantica.Facebook.on({
      exception: function() {
        Ext.create('Semantica.view.Dialog', { msg: 'The connection to Facebook has timed out' }).show();
      },
      loginStatus: function() {
        Ext.get('loading').destroy();
      }
    });
  },

  // Redirect to Facebook when the user taps the Facebook Login button
  onFacebookLogin: function() {
    window.top.location = WL.Facebook.redirectUrl();
  }
});