HomeController = RouteController.extend({
  layoutTemplate: 'MasterLayout',

  subscriptions: function() {
    this.subscribe("ImageFiles").wait();
    this.subscribe("Workpieces", Meteor.userId()).wait();
    this.subscribe("facebook", Meteor.userId()).wait();
  	// return [Meteor.subscribe('Images'), Meteor.subscribe("ImageFiles"), Meteor.subscribe("Workpieces", Meteor.userId()), Meteor.subscribe('facebook', Meteor.userId())];
  },

  action: function() {
    this.render('Home');
  }
});
