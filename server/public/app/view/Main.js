Ext.define('Semantica.view.Main', {

  extend: 'Ext.tab.Panel',

  xtype: 'main',

  requires: [
    'Ext.TitleBar',
    'Ext.SegmentedButton'
    //'Semantica.view.file.List'
  ],

  config: {

    tabBarPosition: 'bottom',

    items: [
      {
        title: 'Home',
        iconCls: 'home',

        styleHtmlContent: true,
        scrollable: true,

        items: {
          docked: 'top',
          xtype: 'titlebar',
          title: 'Semantica',
          items: [
            {
              xtype: 'button',
              iconCls: 'settings',
              align: 'left'
            },
            {
              xtype: 'button',
              iconCls: 'search',
              align: 'right'
            },
            {
              xtype: 'component',
              cls: 'fbProfilePic',
              align: 'right',
              id: 'fbProfilePic',
              tpl: '<img src="https://graph.facebook.com/{profileId}/picture?type=square" />'
            }
          ]
        },

        html: [
            "You've just generated a new Sencha Touch 2 project. What you're looking at right now is the ",
            "contents of <a target='_blank' href=\"app/view/Main.js\">app/view/Main.js</a> - edit that file ",
            "and refresh to change what's rendered here."
        ].join("")
      },
      {
        title: 'Get Started',
        iconCls: 'action',

        items: [
            {
                docked: 'top',
                xtype: 'titlebar',
                title: 'Getting Started'
            },
            {
                xtype: 'video',
                url: 'http://av.vimeo.com/64284/137/87347327.mp4?token=1330978144_f9b698fea38cd408d52a2393240c896c',
                posterUrl: 'http://b.vimeocdn.com/ts/261/062/261062119_640.jpg'
            }
        ]
      }
    ]
  },
  initialize: function() {
    this.callParent();

    // Enable the Tap event on the profile picture in the toolbar, so we can show a logout button
    var profilePic = Ext.getCmp('fbProfilePic');
    if (profilePic) {
      profilePic.element.on('tap', function(e) {
        profilePic.fireEvent('tap', profilePic, e);
      });
    }
  }
});
