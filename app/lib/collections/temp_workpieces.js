// Mongo.Collection의 파라미터로 null을 집어넣어 오직 로컬에서만 DB가 생성되도록 합니다.
// 이 DB는 미티어 startup시마다, 즉 새로고침 시마다 초기화됩니다.
// 따라서 아래에서 브라우저의 local storage에 해당 정보를 저장해놔서 시작 시 끄집어내도록 합니다. 
TempWorkpieces = new Mongo.Collection(null);

if (Meteor.isClient) {
    // UserRecordController 객체를 정의해줍니다.
    function UserRecordController() {
        // 처음에 브라우저의 localStorage 전역 객체를 받아 가지고 있습니다.
        this.BrowserLocalStorage = localStorage;
    }

    UserRecordController.prototype = {
        // getItem과 setItem 매소드를 래핑하는 부분입니다.
        getUserRecord: function() {
            var self = this;
            var userRecord = self.BrowserLocalStorage.getItem('jeegleUserRecord');
            userRecord = JSON.parse(userRecord);
            return userRecord;
        },
        setUserRecord: function(record) {
            var self = this;
            var userRecord = JSON.stringify(record);
            self.BrowserLocalStorage.setItem('jeegleUserRecord', userRecord);
        }
    }

    // 인스턴스를 생성해줍니다.
    var controller = new UserRecordController();

    Meteor.startup(function() {
        var userRecord = controller.getUserRecord();
        if (!!userRecord) {
            console.log('jeegleUserRecord exists');
            _.each(userRecord, function(element, index, list) {
                TempWorkpieces.insert(element, function(err, result) {
                    if (!!err) {
                        console.log('jeegleUserRecord insert failed: ', err);
                    } else {
                        console.log('jeegleUserRecord initiated: ');
                    }
                });
            });
        } else {
            console.log('jeegleUserRecord does NOT exist');
            controller.setUserRecord([]);
        }
    });

    // 읽기를 제외한 CUD 작업에 대하여 감시를 하고 있다가 로컬 콜렉션에 변화가 있으면
    // 즉시 이를 JSON의 형태로 만들어서 브라우저의 local storage에 저장해줍니다.
    TempWorkpieces.find().observe({
        addedAt: function(document, atIndex, before) {
            console.log('added => ', document, atIndex, before);
            var userRecord = controller.getUserRecord();
            userRecord[atIndex] = document;
            // console.log('json', JSON.stringify(userRecord));
            controller.setUserRecord(userRecord);
        },
        changedAt: function(newDocument, oldDocument, atIndex) {
            console.log('changed => ', newDocument, oldDocument, atIndex);
            var userRecord = controller.getUserRecord();
            userRecord[atIndex] = newDocument;
            // console.log('json', JSON.stringify(userRecord));
            controller.setUserRecord(userRecord);
        },
        removedAt: function(oldDocument, atIndex) {
            console.log('removed => ', oldDocument, atIndex);
            var userRecord = controller.getUserRecord();
            // splice로 해당 index의 object literal을 삭제합니다.
            userRecord.splice(atIndex, 1);
            // console.log('json', JSON.stringify(userRecord));
            controller.setUserRecord(userRecord);
        }
    });
}