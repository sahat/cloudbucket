var app = {
  models: {},
  views: {},
  routers: {},
  utils: {}
};

$(document).on("ready", function () {
  app.router = new app.routers.AppRouter();
  app.utils.templates.load(["HomeView"],
    function () {
        app.router = new app.routers.AppRouter();
        Backbone.history.start();
    });
});