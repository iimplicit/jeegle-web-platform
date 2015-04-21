/**
 * Meteor.publish('items', function (param1, param2) {
 *  this.ready();
 * });
 */


Meteor.publish('Images', function( /* args */ ) {
  return Images.find();
});

Meteor.publish('ImageFiles', function( /* args */ ) {
  return ImageFiles.find();
});

Meteor.publish('Workpieces', function(userId) {
  return Workpieces.find({
    createdBy: userId
  }, {
    sort: {
      updatedAt: -1
    }
  });
});

Meteor.publish('facebook', function(userId) {
  return Meteor.users.find({
    _id: userId
  }, {
    fields: {
      "services.facebook.accessToken": 1
    }
  })
});
