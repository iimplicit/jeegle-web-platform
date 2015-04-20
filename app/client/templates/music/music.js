/*****************************************************************************/
/* Music: Event Handlers */
/*****************************************************************************/
Template.Music.events({
	"click [data-button]": function(e, tmpl){
		// events 안에서 this는 data context 자체입니다.
		// 한편 created, rendered, destroyed 내에서 this는 Blaze.TemplateInstance입니다.
		// 즉, events의 this와 후자의 this.data는 같은 객체를 가리킵니다.
		console.log(this);
		// var musicId = this.musicId;
		// window.location = "bpc://landing?type=play_radio&channel_id=60&track_id=300000000000000000000000" + musicId;
	}
});

/*****************************************************************************/
/* Music: Helpers */
/*****************************************************************************/
Template.Music.helpers({
});

/*****************************************************************************/
/* Music: Lifecycle Hooks */
/*****************************************************************************/
Template.Music.created = function () {
};

Template.Music.rendered = function () {
	$("[data-button]").trigger("click");
};

Template.Music.destroyed = function () {
};
