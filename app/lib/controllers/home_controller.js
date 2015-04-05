HomeController = RouteController.extend({
  layoutTemplate: 'MasterLayout',

  subscriptions: function() {
  	return [Meteor.subscribe("Images")];
  },

  action: function() {
    this.render('Home');
  }
});
