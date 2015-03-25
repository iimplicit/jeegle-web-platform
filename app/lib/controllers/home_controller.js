HomeController = RouteController.extend({
  layoutTemplate: 'MasterLayout',

  subscriptions: function() {
  	Meteor.subscribe("images");
  },

  action: function() {
    this.render('Home');
  }
});
