ShareController = RouteController.extend({
  title: function() {
    return "test";
  }, 
  metaProperties: {
    'og:type': 'article',
    'og:title': 'My click bait title',
    'og:image': 'http://mysite.com/images/click-bait.png'
  },
  metaNames: {
    "twitter:card": "summary",
    "twitter:site": "@twitterhandle",
    "twitter:title": "Cat Tripple Back Flip",
    "twitter:description": "Cat Lands a Tripple Back Flip on a Skateboard",
    "twitter:image": "http://mysite.com/images/image-for-twitter-card.png"
  },
  subscriptions: function () {
    // set up the subscriptions for the route and optionally
    // wait on them like this:
    //
    // this.subscribe('item', this.params._id).wait();
    //
    // "Waiting" on a subscription does not block. Instead,
    // the subscription handle is added to a reactive list
    // and when all items in this list are ready, this.ready()
    // returns true in any of your route functions.
  },

  data: function () {
    // return a global data context like this:
    // Items.findOne({_id: this.params._id});
  },

  action: function () {
    // You can create as many action functions as you'd like.
    // This is the primary function for running your route.
    // Usually it just renders a template to a page. But it
    // might also perform some conditional logic. Override
    // the data context by providing it as an option in the
    // last parameter.
    this.render('Share', { /* data: {} */});
  }
});
