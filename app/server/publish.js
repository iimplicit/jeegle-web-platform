/**
 * Meteor.publish('items', function (param1, param2) {
 *  this.ready();
 * });
 */


Meteor.publish('images', function (/* args */) {
  return Images.find();
Meteor.publish('Images', function( /* args */ ) {
    return Images.find();
});

Meteor.publish('ImageFiles', function( /* args */ ) {
    return ImageFiles.find();
});

});