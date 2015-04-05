/****************************************************************************
 * 이미지 메타 데이터 컬렉션
 * file 프로퍼티에 직접 바이너리로 저장하거나, originalImageUrl 부분에 외부 주소로 저장합니다.
 ****************************************************************************/

Images = new Mongo.Collection('images');

// 현재는 다른 validation을 수행하지 않고 무조건 insert, update, remove를 허용해줍니다. 
if (Meteor.isServer) {
    Images.allow({
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
}

// aldeed:collection2와 aldeed:simple-schema를 사용하여 스키마를 정의하고, CRUD시 잘못된 데이터의 입출력을 방지합니다.
Images.attachSchema(new SimpleSchema({
    title: {
        type: String,
        label: "title of the image",
        optional: true
    },
    file: {
        type: Object,
        label: "id of the 'imageFiles' document (ObjectId)",
        optional: true
    },
    originalImageUrl: {
        type: String,
        label: "original url of the image before being downloaded",
        min: 0,
        optional: true
    },
    thumbnailImageUrl: {
        type: String,
        label: "original thumbnail url of the image before being downloaded",
        min: 0,
        optional: true
    },
    tags: {
        type: [Object],
        label: "an array of tag objects that are relevant to the image",
        optional: true
    },
    "tags.$.word": {
        type: String,
        optional: true
    },
    "tags.$.langType": {
        type: String,
        optional: true
    },
    "tags.$.score": {
        type: Number,
        optional: true
    },
    alt: {
        type: String,
        label: "an alt attribute of the image element",
        optional: true
    },
    extra: {
        type: Object,
        label: "an extra space for future extension",
        optional: true
    },
    isAvailable: {
        type: Boolean,
        label: "availability of the image",
        optional: true
    }
}));

if (Meteor.isServer) {
    Meteor.startup(function() {
        // Restivus 사용 전체에 있어서 한 번만 있어도 되는 부분
        Restivus.configure({
            useAuth: false,
            prettyJson: true
        });

        // Restivus에 Images와 관련된 서버사이드 라우터를 부착하는 부분
        // deleteAll 앤드포인트는 현재 사용이 금지되어 있다.
        Restivus.addCollection(Images, {
            excludedEndpoints: ["deleteAll"],
            endpoints: {
                put: {
                    action: function() {
                        var updatedItem = this.request.body;
                        // {validate: false}
                        // this.bodyParams 
                        // maybe because of put and patch difference
                        if (Images.update({
                            _id: this.urlParams.id
                        }, {
                            $set: updatedItem
                        })) {
                            return {
                                status: "success",
                                data: {
                                    message: "Item updated"
                                }
                            };
                        }
                        return {
                            statusCode: 404,
                            body: {
                                status: "fail",
                                message: "Item update not complete"
                            }
                        };
                    }
                }
            }
        });
    });
}