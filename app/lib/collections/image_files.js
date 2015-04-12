/****************************************************************************
 * 이미지 파일 컬렉션, 메타 데이터 도큐멘트에 File 부분
 * 이미지를 CollectionFS를 이용하여 MongoDB에 바이너리로 저장합니다.
 ****************************************************************************/
var ImageFilesStore = new FS.Store.GridFS('ImageFiles', {

    // GridFS 옵션 부분. https://github.com/CollectionFS/Meteor-CollectionFS/tree/devel/packages/gridfs 참조할 것.
});


ImageFiles = new FS.Collection('ImageFiles', {

    stores: [ImageFilesStore]
    // filter: // 저장시 image transform이 필요하면 여기에서 처리하면 됩니다. https://github.com/CollectionFS/Meteor-CollectionFS 참조.

});

if (Meteor.isServer) {
    ImageFiles.allow({
        insert: function(userId, doc) {
            return true;
        },

        update: function(userId, doc, fieldNames, modifier) {
            return true;
        },

        remove: function(userId, doc) {
            return true;
        },
        download: function() {
            return true;
        }
    });
}