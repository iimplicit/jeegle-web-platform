// Sketches는 클라이언트 단에서 사용자들이 작업한 내용들을 임시적으로 저장하기 위한 collection입니다.
// 따라서 서버로 들어가지 않으며, 오로지 클라이언트단에서만 사용됩니다.
Sketches = new Mongo.Collection('sketches');

Sketches.allow({
    insert: function(userId, doc) {
        return true;
    },

    update: function(userId, doc, fieldNames, modifier) {
        return true;
    },

    remove: function(userId, doc) {
        return true;
    }
});