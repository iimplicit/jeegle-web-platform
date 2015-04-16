HomeController = RouteController.extend({
  layoutTemplate: 'MasterLayout',

  subscriptions: function() {
      return [Meteor.subscribe("Images"), Meteor.subscribe("ImageFiles")];
  },

  action: function() {
    this.render('Home');
  }
});
