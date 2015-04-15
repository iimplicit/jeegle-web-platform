/*****************************************************************************/
/* Home: Event Handlers */
/*****************************************************************************/
Template.Home.events({
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
    "click [data-logout]": function() {
        Meteor.logout();
    },
    "submit form": function(e, tmpl) {
        e.preventDefault();
        var query = tmpl.find('input').value;
        tmpl.find('form').reset();
    },
    "keyup input": function(e, tmpl) {
        e.preventDefault();
        var query = tmpl.find('input').value;

        if(query.includes('#')){
            //태그가 들어왔다!
            console.log('Tag mode');

            if(e.which==13){
                tag = query.split('#')[1];
                if(!!tag){
                    // (태그 직접 입력한 경우) 사용자가 찾고 싶은 이미지를 직접적으로 검색합니다. 
                    // 이 경우는 태그와 매우 직접적인 이미지만 가져오는 것이 좋습니다. 사용자가 그것을 의도했기 때문입니다. 
                    // 태그와 직접 연결된 이미지는 필수적으로 가져오고, 연관 이미지는 최대 5개 노드 이상을 넘지 않습니다.
                    // 다만 순서는 첫번째로 연결 노드 개수 낮은것들 우선, 그 중에서는 weight 점수 높은 녀석들 우선,
                    // 그 다음부터는 edge weight 합으로 정렬합니다.  
                    Meteor.neo4j.call('searchImagesForTag', {tagWord:tag, edgeScope:5, NodesLimit:20}, function(err,data){
                        console.dir(data);
                        Images = data.i;
                        Session.set("images", Images);
                    })
                }
            }
        }else{
            // 문장 형태소 분석 후 검색
            // 기획에 맞춰 다시 로직 및 화면 설계가 필요함
            Meteor.call('getNounArrayBySentence', query, function(error, result) {
                if (!!error) {

                } else {
                    // 기획이 확정되면 더 디테일하게 개발합니다. 일단 현재는 분석 태그 중 가장 첫번째에 대한 이미지만 받아옵니다.
                    console.dir(result);
                    for(i=0;i<result.length;i++){
                       Meteor.neo4j.call('searchImagesForTag', {tagWord:result[i], edgeScope:5, NodesLimit:20}, function(err,data){
                            Images = data.i;
                            console.dir(Images);
                            Session.set("images", Images);
                        })   
                    }
                }
            });
        }
    },
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
        NumImages: 20 // 최초 뿌려줄 이미지 개수입니다. 
    },
    function(err, data){
        if(err) throw err;

        if(!!data){
            console.log(data);

            AllImages = data.i;
            
            // Neo4j에 들어있는 이미지를 세션에 넣습니다.
            Session.set("images", AllImages);

            // 그중에서 첫번쨰 이미지를¡ 배경으로 설정합니다.
            Session.set("mainImage", AllImages[0].thumbnailImageUrl);
        }
    });


    // Session.set("mainImage", "http://static.pexels.com/wp-content/uploads/2014/06/fallen-trees-forest-stack-1045-821x550.jpg");
};

Template.Home.destroyed = function() {};