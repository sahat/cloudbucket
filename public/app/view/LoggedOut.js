Ext.define('Semantica.view.LoggedOut', {
  extend: 'Ext.Container',

  xtype: 'loggedOut',

  config: {

    layout: 'fit',
    cls: 'loggedOut',

    items: [
      {
        xtype: 'container',
        layout: {
          type: 'vbox',
          align: 'center'
        },
        cls: 'loginScreen',
        items: [
          {
            xtype: 'button',
            text: 'Login with Facebook',
            id: 'fbLogin',
            cls: 'fbLogin'
          }
        ]
      }
    ]
  }
});
