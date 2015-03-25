/*****************************************************************************/
/* Home: Event Handlers */
/*****************************************************************************/
Template.Home.events({
	"click [data-login]": function(){
		Meteor.loginWithFacebook();	
	},
	"click [data-logout]": function(){
		Meteor.logout();
	},
	"submit form": function(e, tmpl){
		e.preventDefault();
		var query = tmpl.find('input').value;
		tmpl.find('form').reset();
	}, 
	"click [name=moveToEditor]": function(){
		Router.go('editor');
	}
});

/*****************************************************************************/
/* Home: Helpers */
/*****************************************************************************/
Template.Home.helpers({

});

/*****************************************************************************/
/* Home: Lifecycle Hooks */
/*****************************************************************************/
Template.Home.created = function () {
};

Template.Home.rendered = function () {
};

Template.Home.destroyed = function () {
};
