Ext.define('Semantica.model.File', {
    extend: 'Ext.data.Model',
    
    config: {
        fields: [
            { name: 'name', type: 'auto' },
            { name: 'modified', type: 'auto' },
            { name: 'id', type: 'auto' }
        ]
    }
});