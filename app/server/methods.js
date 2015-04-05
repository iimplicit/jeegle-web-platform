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

/*****************************************************************************/
/* Server Only Methods for Neo4j*/
/*****************************************************************************/
Meteor.neo4j.methods({
    'setDefaultImages': function(){
        console.log('Get default images');
        return 'MATCH (i:Image)-[r]-(t:Tag) WITH distinct(i) as i, sum(r.score) as total RETURN i, total ORDER BY total LIMIT {NumImages}';
    },
    'searchImagesForTag': function(){
        console.log('Searching tag matching images');
      // MATCH (t:Tag {word:{tagWord}}), (i:Image), p = allShortestPaths((t)-[r:Weight*..{edgeScope}]-(i)) 
      // 사용자가 입력한 tag에 매칭되는 노드와 이미지를 연결하는 path들을 가져옵니다. (edge수는 edgeScope 제한)
      // WITH p, i, reduce(weight=0, r in relationships(p) | weight+r.score) as totalScore 
      // : shortestPath 알고리즘을 이용하여 path의 weight를 계산하고
      // WITH i, p, totalScore, length(p) as NodeLen order by NodeLen, totalScore desc LIMIT {NodesLimit}
      // : 노드가 적은 순으로, 그 다음 totalScore가 높은 순으로
      // RETURN i, NodeLen, totalScore
      // : 이미지를 받아옵시다.
      // return 'MATCH (t:Tag {word:{tagWord}}), (i:Image), p = allShortestPaths((t)-[r:Weight*..{edgeScope}]-(i)) WITH p, i, reduce(weight=0, r in relationships(p) | weight+r.score) as totalScore WITH i, p, totalScore, length(p) as NodeLen order by NodeLen, totalScore desc LIMIT {NodesLimit} RETURN distinct(i) as i, NodeLen, totalScore';
      return 'MATCH (t:Tag {word:{tagWord}}), (i:Image), p = allShortestPaths((t)-[r:Weight*..{edgeScope}]-(i)) WITH p, i, reduce(weight=0, r in relationships(p) | weight+r.score) as totalScore WITH i, p, totalScore, length(p) as NodeLen order by NodeLen, totalScore desc RETURN distinct(i) as i, NodeLen, totalScore LIMIT {NodesLimit}';
    }
});

