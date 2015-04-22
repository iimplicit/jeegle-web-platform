/*MySQL*/
mysqlConnection = mysql.createConnection({
  host: '128.199.76.251',
  user: 'root',
  password: 'xpgpfks!@',
  database: 'curie_finish'
});

/* Allow client query execution */
Meteor.neo4j.allowClientQuery = false;
/* Custom URL to Neo4j should be here */
Meteor.neo4j.connectionURL = "http://neo4j:xpgpfks!@@128.199.249.209:7474";
// Meteor.neo4j.connectionURL = "http://neo4j:xpgpfks!@@localhost:7474";
/* But deny all writing actions on client */
Meteor.neo4j.set.allow(Meteor.neo4j.rules.write);

/*****************************************************************************/
/* Server Only Methods */
/*****************************************************************************/
Meteor.methods({
     // 주어진 문장을 가지고 ES, Neo4j 등에 질의해 이미지 배열을 얻어 리턴합니다.
     'getNounArrayBySentence': function(sentence) {

        // POST 메소드를 주고 받는 비동기 작업을 다 완료했을 때, 결과를 리턴할 수 있도록 합니다.
        var syncFunc = Meteor.wrapAsync(function(callback) {


            // Meteor.http.post("http://128.199.249.209:9200/jeegle/Images/_search", {
              Meteor.http.get("http://128.199.249.209:9200/jeegle/_analyze?analyzer=korean&text=" + encodeURI(sentence),
                function(error, result) {

                  if (!!error) {
                    console.dir(error);
                    throw new Meteor.Error('querying-to-es-failed', 'Querying to ES Failed..');
                  } else {

                    // 분석된 단어중, 명사만 골라 기존의 tagsArray랑 합친다.
                    var tokenObj = JSON.parse(result.content);

                    var nounArray = new Array();
                    tokenObj.tokens.forEach(function(el, index, array){
                      if(el.type == 'N' || el.type == 'COMPOUND' || el.type == 'SL'){
                        nounArray.push(el.token);
                      }
                    });


                    // 추가적으로 #tag에 대해 neo4j에 질의한다.
                    callback(null, nounArray);
                  }
                });
      });

    var result = null;

    try {
      result = syncFunc();
    } finally {
      return result;
    }
  },
  'getMusicDeeplink': function(keyword){

    var syncFunc = Meteor.wrapAsync(function(callback){

      var encodedKeyword = encodeURIComponent('*'+keyword+'*');
      var url = 'http://tehranslippers.com:9200/jdbc/jdbc/_search?q='+encodedKeyword;
      HTTP.call("GET", url, {}, function(err, result){

        var musicInfo = JSON.parse(result.content).hits.hits;

        for(var i=0;i<musicInfo.length;i++){
          var mySqlSyncFunc = Meteor.wrapAsync(function(callback){
              mysqlConnection.query('SELECT link_id from curie_finish.link_ids WHERE app_id=1 AND song_id='+musicInfo[i]._source.id, function(err, rows, fields) {
                if(!!rows[0]){
                  musicInfo[i]._source.trackId = rows[0].link_id;
                }

                callback(null)
              });
          });

          mySqlSyncFunc();
        }

        callback(null, musicInfo);
      })
    });

    return syncFunc();
  }
});


/*****************************************************************************/
/* Server Only Methods for Neo4j*/
/*****************************************************************************/
Meteor.neo4j.methods({
  'getRandomImages': function(){
      var randomOffset = Math.getRandom(0,100);

      var query = [
        'MATCH (t:Tag)-[r]-(i:Image)',
        'WITH distinct(i) as i, t, sum(r.score) as total',
        'RETURN i, t, total',
        'ORDER BY total',
        'SKIP ' + randomOffset,
        'LIMIT {NumImages}'
      ].join(' ');

      return query;
  },
  'getImagesForTag': function(){
      // Neo4j 쿼리 튜닝 필요.
      var query = [
        'MATCH p = allShortestPaths((t:Tag {word:{tagWord}})-[r:Weight*..{edgeScope}]-(i:Image))',
        'WITH p, t, i, reduce(weight=0, r in relationships(p) | weight+r.score) as totalScore, length(p) as NodeLen',
        'ORDER BY NodeLen, totalScore desc LIMIT {NodesLimit}',
        'RETURN i, t, NodeLen, totalScore'
      ].join(' ');

      return query;
  }
});
