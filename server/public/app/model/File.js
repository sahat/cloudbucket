Ext.define('Semantica.model.File', {
  extend: 'Ext.data.Model',

  config: {
    fields: [
      '_id',
      'name',
      'filetype',
      'size',
      'path',
      'lastAccessed',
      'lastModified',
      'keywords',
      'summary'
    ],
    proxy: {
      type: 'rest',
      url: '/files'
    }
  }
});