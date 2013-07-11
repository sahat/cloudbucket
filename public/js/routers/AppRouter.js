app.routers.AppRouter = Backbone.Router.extend({

    routes: {
        "":                         "home",
        "employees/:id":            "employeeDetails",
        "employees/:id/reports":    "reports",
        "employees/:id/map":        "map"
    },

    home: function() {
      if (!app.homeView) {
          app.homeView = new app.views.HomeView();
          app.homeView.render();
        } else {
          console.log('reusing home view');
          app.homeView.delegateEvents(); // delegate events when the view is recycled
        }
    }
});