/*****************************************************************************/
/* Server Only Methods */
/*****************************************************************************/
Meteor.methods({
    /*
     * Example:
     *
     * '/app/items/insert': function (item) {
     * }
     */

     // 주어진 문장을 가지고 ES, Neo4j 등에 질의해 이미지 배열을 얻어 리턴합니다.
    'getImageArrayBySentence': function(sentence) {

        var basicQuery = {
            query: {
                match: {
                    tags: sentence
                }
            }
        };

        // POST 메소드를 주고 받는 비동기 작업을 다 완료했을 때, 결과를 리턴할 수 있도록 합니다.
        var syncFunc = Meteor.wrapAsync(function(callback) {


            Meteor.http.post("http://128.199.249.209:9200/jeegle/Images/_search", {
                data: basicQuery
            }, function(error, result) {

                if (!!error) {
                    throw new Meteor.Error('querying-to-es-failed', 'Querying to ES Failed..');
                } else {
                    callback(null, result.data.hits.hits);
                }
            });

        });

        var result = null;

        try {
            result = syncFunc();
        } finally {
            return result;
        }
    }
});
