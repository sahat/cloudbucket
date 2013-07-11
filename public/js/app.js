var app = {
  models: {},
  views: {},
  routers: {},
  utils: {}
};

$(document).on("ready", function () {
    app.router = new app.routers.AppRouter();
    app.utils.templates.load(["HomeView", "EmployeeView", "EmployeeListItemView", "ReportsView", "MapView"],
      function () {
        app.router = new app.routers.AppRouter();
        Backbone.history.start();
      });
});