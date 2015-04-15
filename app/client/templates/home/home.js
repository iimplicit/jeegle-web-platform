// Tag 개수를 increase, decrease, get 하는 함수 객체입니다.
tagCounter = new TagCounter();

// 이미지를 저장하고 있는 우선순위 큐입니다.
MaximumImageNum = 20; // 사용자이 입력에 대응하기 위해 기본적으로 우리가 가지고 있어야하는 40개의 이미지
ImageQueue = new priorityQueue(MaximumImageNum); // 이곳에 현재 뿌려지는 모든 이미지들이 큐처럼 들어간다.

/*****************************************************************************/
/* Home: Event Handlers */
/*****************************************************************************/
Template.Home.events({
  "click [data-login]": function() {
    Meteor.loginWithFacebook();
  },
  "click [data-logout]": function() {
    Meteor.logout();
  },
  "submit form": function(e, tmpl) {
    e.preventDefault();
    var query = tmpl.find('input').value;
    tmpl.find('form').reset();
  },
  "keyup #input-15": _.debounce(function(e, tmpl){
    // 사용자 입력이 들어오면 Neo4j에 쿼리를 날립니다. debounce 함수로 적절하게 쿼리양을 조절합니다.
    e.preventDefault();

    // 사용자 입력
    var query = tmpl.find('input').value;
    var spaceRemovedQuery = query.replace(/\s+/g, '');

    // 태그를 제외한 문장
    var sentence = query.split('#')[0];
    var spaceRemovedSentence = sentence.replace(/\s+/g, '');

    // 태그 작성 중엔 쿼리날리지 않아도 됩니다.
    var writingTagFlag = false;

    // 아무 것도 없는 경우
    if(!query.includes('#')){
      // 문장만 있는 경우
      console.log('only sentence');

    }else{
      // 태그 들어왔다. 엔터칠때까진 아무것도 안해도 됨.
      writingTagFlag = true;

      // #태그가 있는데 enter키가 들어왔을 경우 태그를 처리한다.
      if(e.which==13){
        console.log('There is a tag');

        //if tag is not exist, tag will be undefined
        var tag = query.split('#')[1];
        var spaceRemovedTag = tag.replace(/\s+/g,'');
        console.log(tag);

        // delete #tag from input box
        tmpl.find('input').value = sentence;

        // return if there is no tag word
        if(spaceRemovedTag=="") return;

        // create tag div and delete
        tagCounter.incTagCount();
        createTagDiv(tagCounter.getTagCount(), tag)

        // Neo4j로 태그 쿼리를 날립니다.
        console.log('hey!')
        Meteor.neo4j.call('searchImagesForTag', {tagWord:tag, edgeScope:3, NodesLimit:20}, function(err,data){
          console.dir(data);
          Images = data.i;
          pushImages(Images, 10, data.t);
          Session.set("images", ImageQueue.heap);
        })

        writingTagFlag = false;
      }
    }

    if(writingTagFlag==false && !spaceRemovedSentence==""){
      // 문장 형태소 분석 후 검색
      console.log('ee'+sentence)
      Meteor.call('getNounArrayBySentence', sentence, function(error, result) {
        if (!!error) {
          throw error;
        } else {
          // result에는 형태소 분석 결과 (현재 한글 명사, 한글 복합명사, 영어 단어 가리지 않고 모두)가 들어온다.
          // 이 중에서 어떤 태그가 중요한지는 Neo4j만이 알고 있다.
          console.log("형태소 분석 결과: ")
          console.dir(result);

          // 키워드 당 대충 이 정도..
          howManyEach = parseInt(MaximumImageNum/result.length);

          // 키워드 별로 이미지를 찾아오자!
          callCnt = 0;
          for(i=0;i<result.length;i++){
            // 비동기를 주의해야한다. 여기서 한방에 부르고 떠난다.

            // (태그 직접 입력한 경우) 사용자가 찾고 싶은 이미지를 직접적으로 검색합니다.
            // 이 경우는 태그와 매우 직접적인 이미지만 가져오는 것이 좋습니다. 사용자가 그것을 의도했기 때문입니다.
            // 태그와 직접 연결된 이미지는 필수적으로 가져오고, 연관 이미지는 최대 3개 노드 이상을 넘지 않습니다.
            // 다만 순서는 첫번째로 연결 노드 개수 낮은것들 우선, 그 중에서는 weight 점수 높은 녀석들 우선,
            // 그 다음부터는 edge weight 합으로 정렬합니다.
            Meteor.neo4j.call('searchImagesForTag', {tagWord:result[i], edgeScope:3, NodesLimit:howManyEach}, function(err,data){
              callCnt++;
              if(data.t.length==0) return; //no image

              if(result.indexOf(data.t[0].word)==-1){
                // 만약 현재 구해야하는 result가 아닌 결과를 받아왔으면 과감하게 빠이를 외치자.
                // 넌 늦었어.
                return;
              }else{
                // 이들은 모두 현재 구해야하는 result들이다.
                Images = data.i;
                pushImages(Images, 5, data.t);

                if(callCnt==result.length){
                  //마지막에만 set
                  console.dir(ImageQueue.heap);
                  Session.set("images", ImageQueue.heap);
    "click [data-login-and-share]": function() {
        // 미티어의 기본 loginWith<Service> 매소드를 사용하여 로그인을 합니다. 
        // 여기서 requestPermissions란에 'user_photos', 'publish_actions'를 요청합니다.
        Meteor.loginWithFacebook({
            requestPermissions: ['user_photos', 'publish_actions']
        }, function(err) {
            // Deps.autorun은 미티어의 reactive programming에서 계속 의존하고 있는 변수들의 루프를 감시하고 있다가
            // 그 변수가 바뀔 경우 다시 돌아가는 매소드입니다.
            // 여기서는 계속 Meteor.user().services를 감시하고 있다가 PUB/SUB에 의해 이게 생기게 되면, if 문 안의 코드를 실행시키게 됩니다.
            Deps.autorun(function(computation) {
                if (Meteor.user().services) {
                    // 회원정보를 받아올 때 가져오는 accessToken을 가져옵니다.
                    // 실제적으로 데이터를 서버에서 가져오는 부분은 PUB/SUB에 의해 home_controller.js와  server/publish.js에 구현되어있습니다.
                    var accessToken = Meteor.user().services.facebook.accessToken;

                    // 페이스북의 graph api를 POST 방식으로 콜합니다.
                    // 아래의 FB 객체는 Facebook JavaScript SDK의 광역 객체입니다. (현재 rendered에서 이 FB객체를 불러오고 있습니다.)
                    // *** 아래의 api의 정보는 페이스북 앱으로 등록된 "Jeegle"의 대시보드에서 Open Graph에서 확인하실 수 있습니다. ***
                    // call 자체는 story를 참조하고,
                    // 첨부하는 json의 최상단은 action,
                    // 그리고 가장 하단의 jeegle object는 object를 참조합니다.
                    // *** jeegle object 설명 ***
                    // og:url | <hostname>/music/:_id | _id에는 Beat의 음악 id 6자리를 넣습니다.
                    // jeegle-web:music_info | String | Beat에서 제공하는 제목과 가수를 넣습니다. 예를 들어 "맛좋은 산 - San E"
                    // og:image | String | 포스팅할 이미지의 URL을 넣습니다. (페이스북에서 허용하는 다른 이미지 형식도 가능합니다.)
                    FB.api(
                        "/me/jeegle-web:create",
                        "POST", {
                            "access_token": accessToken,
                            "created_time": new Date().toISOString(),
                            "message": "신기하다.",
                            "fb:explicitly_shared": true,
                            "jeegle": {
                                "og:type": "jeegle-web:jeegle",
                                "og:url": "http://172.16.101.216:3000/music/123456",
                                "og:title": "Sample Jeegle",
                                "og:locale": "ko_KR",
                                "og:image": "http://placehold.it/640x640",
                                "og:image:width": "640",
                                "og:image:height": "640",
                                "fb:app_id": "575943959175026",
                                "jeegle-web:music_info": "music_info",
                                "al:web:url": "http://placehold.it/640x640",
                                "al:web:should_fallback": true,
                                "al:ios:url": "bpc://landing?type=play_radio&channel_id=60&track_id=3000000000000000000000008094e1",
                                "al:ios:app_store_id": "853073541",
                                "al:ios:app_name": "BEAT",
                                "al:iphone:url": "bpc://landing?type=play_radio&channel_id=60&track_id=3000000000000000000000008094e1",
                                "al:iphone:app_store_id": "853073541",
                                "al:iphone:app_name": "BEAT",
                                "al:android:url": "bpc://landing?type=play_radio&channel_id=60&track_id=3000000000000000000000008094e1",
                                "al:android:package": "com.beatpacking.beat",
                                "al:android:app_name": "BEAT"
                            }
                        },
                        function(response) {
                            console.dir(response);
                            if (response && !response.error) {
                                computation.stop();
                            }
                        }
                    );

                    // 향후 사용할 가능성이 있어서 남겨두었습니다. 페이스북 일반적인 포스트를 생성할 때 아래의 방식으로 api 콜을 날립니다.
                    // FB.api(
                    //     "/me/feed",
                    //     "POST", {
                    //         "access_token": accessToken,
                    //         message: "이미지",
                    //         url: "http://128.199.249.209:9990/images/activity-aviation-fly-2302-640.jpg"
                    //     },
                    //     function(response) {
                    //         if (!response || response.error) {
                    //             console.log(response.error);
                    //         } else {
                    //             console.log(response);
                    //             console.log(response.id);
                    //         }
                    //     }
                    // );

                    // 마찬가지로 향후 사용할 가능성이 있어서 남겨두었습니다. 
                    // 먼저 페이스북에서 앨범을 만들고, 그 앨범 안에 사진을 넣는 방식으로 포스팅 할 때 이런 방식으로 api 콜을 날립니다.
                    // 나중에는 먼저 앨범이 있는지 확인하고, 날짜를 사진 이름으로 해서 올리는 방식으로 향후 개선해야 합니다.
                    // FB.api(
                    //     "/me/albums",
                    //     "POST", {
                    //         "name": "Jeegle(지글)",
                    //         "message": "지글 앱을 위한 앨범입니다."
                    //     },
                    //     function(response) {
                    //         if (!response || response.error) {
                    //             console.log(response.error);
                    //         } else {
                    //             var albumID = response.id;
                    //             FB.api(
                    //                 "/" + albumID + "/photos",
                    //                 "POST", {
                    //                     message: "지글 테스트 사진 업로드입니다.",
                    //                     url: "http://4de08c6af39c20343f39-fec7c301d7eca18188203e783b444e60.r36.cf1.rackcdn.com/2010/04/facebook-social.jpg"
                    //                 },
                    //                 function(response) {
                    //                     if (!response || response.error) {
                    //                         console.log(response.error);
                    //                     } else {
                    //                         console.log(response);
                    //                         console.log(response.id);
                    //                     }
                    //                 }
                    //             );
                    //         }
                    //     }
                    // );
                }
            });
        });
    },
                }
              }
            })
          }
        }
      });
    }
  },300),
  "click [name=moveToEditor]": function() {
    Router.go('editor', {}, {
      query: {
        _url: Session.get('mainImage')
      }
    });
  },
  "click [data-image-item]": function(e, tmpl) {
    var background = e.target.style.background;
    var url = background.slice(4, background.length - 1);

    TempWorkpieces.update({
      _id: Session.get("currentId")
    }, {
      $set: {
        updatedAt: new Date,
        'content.0.url': url
      }
    });
  }
});

/*****************************************************************************/
/* Home: Helpers */
/*****************************************************************************/
Template.Home.helpers({
    images: function() {
        return Session.get("images");
    },
    mainImage: function() {
        return TempWorkpieces.findOne({
            _id: Session.get("currentId")
        }).content[0].url;
    }
});

/*****************************************************************************/
/* Home: Lifecycle Hooks */
/*****************************************************************************/
Template.Home.created = function() {
  var firstSketch = {
    createdAt: new Date,
    updatedAt: new Date,
    createdBy: Meteor.userId() || "Anonymous",
    content: [{
      type: "image",
      url: "http://static.pexels.com/wp-content/uploads/2014/06/fallen-trees-forest-stack-1045-821x550.jpg"
    }, {
      type: "textbox",
      innerText: ""
    }]
  }

    TempWorkpieces.insert(firstSketch, function(err, result) {
        if (!err) {
            // 저장 후 나온 아이디값을 currentIndex session에 저장합니다.
            Session.set("currentId", result);
        } else {
            console.log('sketch insert error: ', err);
        }
    });
};

Template.Home.rendered = function() {
  $('#tagBox').on('click', '[data-tag]', function(e) {
    console.log('해당 tag를 삭제합니다.');

    // prevent a tag default event
    e.preventDefault();

    // select tag element
    var selectedWord = $(this).attr('data-tag');

    // delete tag element
    this.parentElement.removeChild(this);

    // decrease tag count
    tagCounter.decTagCount();
    console.log(tagCounter.getTagCount())

    // reload images (delete selected images)
  });
    // 페이스북 광역 FB 객체를 정의하는 부분입니다.
    window.fbAsyncInit = function() {
        FB.init({
            appId: '575943959175026',
            status: true,
            xfbml: true,
            version: 'v2.0'
        });
    };

  // Auto focus when page is loaded
  $('#input-15').focus();

  document.onkeypress = function(e) {
    // Auto focus when keyboard is pressed (except when login)
    $('#input-15').focus();

    if (e.keyCode == 13) {
      // Enter key event
    }
  };

  // 이미지를 Neo4j database에서 받아옵니다.
  Meteor.neo4j.call('setDefaultImages',{
    NumImages: MaximumImageNum // 최초 뿌려줄 이미지 개수입니다.
  },
  function(err, data){
    if(err) throw err;

    if(!!data){
      AllImages = data.i;
      console.log(AllImages);

      pushImages(AllImages, 0, data.t);
      Session.set("images", ImageQueue.heap);

      // 그중에서 첫번째 이미지를¡ 배경으로 설정합니다.
      Session.set("mainImage", AllImages[0].thumbnailImageUrl);
    }
  });
};

Template.Home.destroyed = function() {};

function createTagDiv(tagNum, tagWord){
  var html = '';
  // 보통 다른 id줄때 id? name? val? 뭐로 줌?
  html += '<li><a href="#" id="tagNum-'+tagNum+'" data-tag='+tagWord+'>';
  html += tagWord;
  html += '</a></li>';

  $('#tagBox').append(html);
}

// 사용자가 #태그를 다는 개수를 셉니다.
function TagCounter(){
  var cnt = 0;
  this.decTagCount = function(){
    cnt--;
  }
  this.incTagCount = function(){
    cnt++;
  }
  this.getTagCount = function(){
    return cnt;
  }
}

function pushImages(Images, priority, tag){
  for(k=0;k<Images.length;k++){
    var duplicatedFlag = false;
    for(j=0;j<ImageQueue.heap.length;j++){
      if(ImageQueue.heap[j].data.thumbnailImageUrl == Images[k].thumbnailImageUrl){
        duplicatedFlag = true;
        console.log('duplicated!')
        break;
      }
    }
    if(duplicatedFlag) continue;
    ImageQueue.push(Images[k], priority, tag[k]);
  }
}
