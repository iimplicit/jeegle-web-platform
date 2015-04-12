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

    // Session.set("images", [{
    //     "_index": "jeegle",
    //     "_type": "Images",
    //     "_id": "wMhTihYSvyumNjnb9",
    //     "_score": 1,
    //     "_source": {
    //         "tags": [
    //             "fallen trees",
    //             "forest",
    //             "lumber",
    //             "material",
    //             "stack",
    //             "stacked",
    //             "tree trunks",
    //             "wood"
    //         ],
    //         "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/fallen-trees-forest-stack-1045.jpg",
    //         "_id": "wMhTihYSvyumNjnb9",
    //         "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/fallen-trees-forest-stack-1045-821x550.jpg"
    //     }
    // }, {
    //     "_index": "jeegle",
    //     "_type": "Images",
    //     "_id": "N2u4Hy6WXnNML5H4m",
    //     "_score": 1,
    //     "_source": {
    //         "tags": [
    //             "building",
    //             "city",
    //             "closely",
    //             "fire escape",
    //             "fire ladder",
    //             "house",
    //             "skyscraper"
    //         ],
    //         "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/city-closely-fire-ladder-1070.jpg",
    //         "_id": "N2u4Hy6WXnNML5H4m",
    //         "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/city-closely-fire-ladder-1070-901x550.jpg"
    //     }
    // }, {
    //     "_index": "jeegle",
    //     "_type": "Images",
    //     "_id": "ckpa7xMFkFJ3XywTF",
    //     "_score": 1,
    //     "_source": {
    //         "tags": [
    //             "buildings",
    //             "city",
    //             "sepia",
    //             "skyscrapers",
    //             "streets",
    //             "urban",
    //             "view"
    //         ],
    //         "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/buildings-city-sepia-1054.jpg",
    //         "_id": "ckpa7xMFkFJ3XywTF",
    //         "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/buildings-city-sepia-1054-733x550.jpg"
    //     }
    // }, {
    //     "_index": "jeegle",
    //     "_type": "Images",
    //     "_id": "sQh3penvNxbpeHKFM",
    //     "_score": 1,
    //     "_source": {
    //         "tags": [
    //             "animal",
    //             "eye",
    //             "horse",
    //             "poney"
    //         ],
    //         "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/animal-eye-horse-1027.jpg",
    //         "_id": "sQh3penvNxbpeHKFM",
    //         "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/animal-eye-horse-1027-825x550.jpg"
    //     }
    // }, {
    //     "_index": "jeegle",
    //     "_type": "Images",
    //     "_id": "LxuEmvfK35DEd2rFc",
    //     "_score": 1,
    //     "_source": {
    //         "tags": [
    //             "amour",
    //             "couple",
    //             "date",
    //             "feelings",
    //             "hug",
    //             "hugging",
    //             "kissing",
    //             "love",
    //             "lovers",
    //             "people",
    //             "romantic",
    //             "sun",
    //             "together"
    //         ],
    //         "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/couple-kissing-love-1075.jpg",
    //         "_id": "LxuEmvfK35DEd2rFc",
    //         "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/couple-kissing-love-1075-825x550.jpg"
    //     }
    // }, {
    //     "_index": "jeegle",
    //     "_type": "Images",
    //     "_id": "ZNZkfjTnDAGJWQfuC",
    //     "_score": 1,
    //     "_source": {
    //         "tags": [
    //             "broken",
    //             "dangerous",
    //             "jetty",
    //             "lake",
    //             "landing stage",
    //             "pontoon",
    //             "risky",
    //             "sea",
    //             "wood"
    //         ],
    //         "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/broken-dangerous-lake-1087.jpg",
    //         "_id": "ZNZkfjTnDAGJWQfuC",
    //         "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/broken-dangerous-lake-1087-849x550.jpg"
    //     }
    // }, {
    //     "_index": "jeegle",
    //     "_type": "Images",
    //     "_id": "NmSyGbpcwXkoWBPZQ",
    //     "_score": 1,
    //     "_source": {
    //         "tags": [
    //             "creepy",
    //             "curve",
    //             "dark",
    //             "fog",
    //             "foggy",
    //             "forest",
    //             "railroad",
    //             "rails",
    //             "railway",
    //             "scary"
    //         ],
    //         "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/creepy-curve-dark-1096.jpg",
    //         "_id": "NmSyGbpcwXkoWBPZQ",
    //         "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/creepy-curve-dark-1096-824x550.jpg"
    //     }
    // }, {
    //     "_index": "jeegle",
    //     "_type": "Images",
    //     "_id": "rCtu9kTNXwegNqabx",
    //     "_score": 1,
    //     "_source": {
    //         "tags": [
    //             "lake",
    //             "landscape",
    //             "mountains",
    //             "nature",
    //             "sky",
    //             "snow",
    //             "winter"
    //         ],
    //         "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/lake-landscape-mountains-1130.jpg",
    //         "_id": "rCtu9kTNXwegNqabx",
    //         "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/lake-landscape-mountains-1130-825x550.jpg"
    //     }
    // }, {
    //     "_index": "jeegle",
    //     "_type": "Images",
    //     "_id": "HLcQKMDZWH8jTDcDi",
    //     "_score": 1,
    //     "_source": {
    //         "tags": [
    //             "candle",
    //             "fire",
    //             "flame",
    //             "hearts"
    //         ],
    //         "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/candle-fire-flame-1095.jpg",
    //         "_id": "HLcQKMDZWH8jTDcDi",
    //         "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/candle-fire-flame-1095-825x550.jpg"
    //     }
    // }, {
    //     "_index": "jeegle",
    //     "_type": "Images",
    //     "_id": "MvLdugP43CdpCpYyE",
    //     "_score": 1,
    //     "_source": {
    //         "tags": [
    //             "apple",
    //             "computer",
    //             "desk",
    //             "device",
    //             "imac",
    //             "keyboard",
    //             "magic mouse",
    //             "technology",
    //             "workspace",
    //             "workstation"
    //         ],
    //         "originalImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/apple-imac-keyboard-1149.jpg",
    //         "_id": "MvLdugP43CdpCpYyE",
    //         "thumbnailImageUrl": "http://static.pexels.com/wp-content/uploads/2014/06/apple-imac-keyboard-1149-825x550.jpg"
    //     }
    // }]);

    // Session.set("mainImage", "http://static.pexels.com/wp-content/uploads/2014/06/fallen-trees-forest-stack-1045-821x550.jpg");
};

Template.Home.destroyed = function() {};