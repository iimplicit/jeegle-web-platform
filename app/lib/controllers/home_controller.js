HomeController = RouteController.extend({
  layoutTemplate: 'MasterLayout',

  subscriptions: function() {
  	return [Meteor.subscribe("Images"), Meteor.subscribe("ImageFiles"), Meteor.subscribe('facebook', Meteor.userId())];
  },

  action: function() {
    this.render('Home');
  }
});
