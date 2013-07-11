app.views.HomeView = Backbone.View.extend({
  initialize: function () {
//    this.searchResults = new app.models.EmployeeCollection();
//    this.searchresultsView = new app.views.EmployeeListView({model: this.searchResults});
  },
    
  render: function() {
    this.$el.html(this.template());
    //$('.scroller', this.el).append(this.$el.h);
    return this;
  }
});