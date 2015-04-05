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

Meteor.publish('workpiece', function(_id) {
    return Workpieces.find({
        _id: _id
    });
});