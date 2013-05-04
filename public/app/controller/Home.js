Ext.define('Semantica.controller.Home', {
  extend: 'Ext.app.Controller',

  config: {

    routes: {
      'files/:id': 'onFileUrl'
    },

    refs: {
      loggedOut: 'loggedOut'
    },

    control: {
      '#fbProfilePic': {
        tap: 'onProfileTap'
      },
      '#logoutButton': {
        tap: 'logout'
      }
    }
  },

  init: function() {
    Semantica.app.on({
      localStorageData: 'onLocalStorageData',
      scope: this
    });
  },

  onLocalStorageData: function(data) {
    var store = Ext.getStore('Movies');

    this.initContainer();
    store.setData(data.movies);
    store.fireEvent('load', store, store.data);

    this.onFirstLoad(data.profileId);
  },

  onFacebookLogin: function() {

    Ext.getBody().removeCls('splashBg');

    Ext.getStore('Movies').onBefore('datarefresh', function(store, data, operation, eOpts, e) {

      var cache = JSON.stringify({
        movies: operation.getResponse().movies,
        profileId: FB.getUserID()
      });

      if (window.localStorage && window.localStorage.WL && window.localStorage.WL == cache) {
        return false;
      }

      window.localStorage.WL = cache;

      if (!this.firstLoad) {
        this.onFirstLoad(FB.getUserID());
        this.firstLoad = true;
      }
    }, this);

    Ext.getStore('Movies').load();
  },

  onFirstLoad: function(profileId) {
    Ext.getCmp('fbProfilePic').setData({
      profileId: profileId
    });

    var learnMore = Ext.ComponentQuery.query('#promo-container')[0];

    learnMore.element.on({
      tap: this.onAbout,
      scope: this,
      delegate: 'button'
    });
  }
});