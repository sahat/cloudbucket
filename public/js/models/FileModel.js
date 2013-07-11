// File Model
app.models.File = Backbone.Model.extend({
  urlRoot: '/api/files'
});

// File Collection
app.models.FileCollection = Backbone.Collection.extend({
  model: app.models.File,
  url: '/api/files'
});