// Tag 개수를 increase, decrease, get 하는 함수 객체입니다.
tagCounter = new TagCounter();

// 이미지를 저장하고 있는 우선순위 큐입니다.
MaximumImageNum = 21; // 홀수개입니다. 사용자이 입력에 대응하기 위해 기본적으로 우리가 가지고 있어야하는 40개의 이미지
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

        // delete #tag from input box
        tmpl.find('input').value = sentence;

        // return if there is no tag word
        if(spaceRemovedTag=="") return;

        // create tag div and delete
        tagCounter.incTagCount();
        createTagDiv(tagCounter.getTagCount(), tag)

        // Neo4j로 태그 쿼리를 날립니다.
        Meteor.neo4j.call('searchImagesForTag', {tagWord:tag, edgeScope:3, NodesLimit:20}, function(err,data){
          Images = data.i;
          pushImages(Images, 10, data.t);
          Session.set("images", ImageQueue.heap);
        })

        writingTagFlag = false;
      }
    }

    if(writingTagFlag==false && !spaceRemovedSentence==""){
      // 문장 형태소 분석 후 검색
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
        console.log('hello images!');

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
  console.log('All html is rendered');

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

  // Auto focus when page is loaded
  $('#input-15').focus();
  //
  // document.onkeypress = function(e) {
  //   // Auto focus when keyboard is pressed (except when login)
  //   $('#input-15').focus();
  //
  //   if (e.keyCode == 13) {
  //     // Enter key event
  //   }
  // };

  // 이미지를 Neo4j database에서 받아옵니다.
  Meteor.neo4j.call('setDefaultImages',{
    NumImages: MaximumImageNum // 최초 뿌려줄 이미지 개수입니다.
  },
  function(err, data){
    if(err) throw err;

    if(!!data){
      AllImages = data.i;
      // console.log(AllImages);

      pushImages(AllImages, 0, data.t);
      Session.set("images", ImageQueue.heap);

      // 그중에서 첫번째 이미지를¡ 배경으로 설정합니다.
      Session.set("mainImage", AllImages[0].thumbnailImageUrl);
    }
  });

  $('#meteordoctor').click(function(){
    setJeegleSlider();
  })

  // Deps.autorun(function(computation){
  //   if(Session.get('images')){
  //   }
  // });
};

function setJeegleSlider(){
    // slider_box
    //  slider
    //    slider ul
    //       slider ul li

    // 여기서부터 지글 슬라이드 코드 입니다.
    var slider_options = {
        $ArrowWidth: 30,
        $ArrowHeight: 30,
        $CenterLen: 640,
        $NestedWidth: 20,
        $DisplayPieces: 11 //need to be odd number
    };

    if(slider_options.$DisplayPieces%2==0){
      // I said it's odd.
      slider_options.$DisplayPieces = slider_options.$DisplayPieces+1;
    }

    //(ex) 21개면 centerElem은 11
    centerElem = parseInt(MaximumImageNum/2)+1;
    console.log('center:'+centerElem);

    // slider의 너비와 높이를 받아옵니다.
    divWidth = $('#slider_box').width();
    divHeight = $('#slider_box').height();

    // 작은 이미지의 전체 길이
    smallElemsWidth = divWidth - slider_options.$CenterLen;

    // 작은 이미지의 각자 길이 width=height
    smallElemsDivLen = parseInt(smallElemsWidth/(slider_options.$DisplayPieces-1));
    $('.image-div').css('width', smallElemsDivLen);
    $('.image-div').css('height', smallElemsDivLen);

    // slider ul 또한 동일한 height를 주게 됩니다.
    $('#slider').css('height', smallElemsDivLen);

    // 중앙 엘리먼트 크기 설정
    $('#slider ul li:nth-child('+centerElem+')').css('width', slider_options.$CenterLen);
    $('#slider ul li:nth-child('+centerElem+')').css('height',  slider_options.$CenterLen);

    // 가운데 정렬!
    var slideULWidth = smallElemsDivLen*(MaximumImageNum-1)+slider_options.$CenterLen;
    var leftPosition = -(slideULWidth-divWidth)/2
    $('#slider').css('left', leftPosition);

    // 버튼 위치 설정
    $('.control_prev').css('top', (smallElemsDivLen-slider_options.$ArrowHeight)/2+"px");
    $('.control_next').css('top', (smallElemsDivLen-slider_options.$ArrowHeight)/2+"px");

    // 이미지 별 중앙 정렬을 해줍니다.
    var index=0;
    slider_images = document.getElementsByName('images_in_belt');
    _.forEach(slider_images, function(img){

      imgWidth = img.width;
      imgHeight = img.height;
      // console.log(img.width);

      if(imgWidth > imgHeight){
        // 가로가 더 긴 경우
        img.style.height = "100%";
        img.style.top = 0;
        if(index==centerElem-1){
          img.style.left = -(img.width-slider_options.$CenterLen)/2 +"px";
        }else{
          img.style.left = -(img.width-smallElemsDivLen)/2+"px";
        }
      }else{
        // 세로가 더 긴 경우
        img.style.width = "100%";
        img.style.left = 0;
        if(index==centerElem-1){
          img.style.top = -(img.height-slider_options.$CenterLen)/2+"px";
        }else{
          img.style.top = -(img.height-smallElemsDivLen)/2+"px";
        }
      }

      index++;
    })

    function moveLeft(cen) {
        $('#slider ul').animate({
            left: + smallElemsDivLen
        }, 200, function () {
            $('#slider ul li:last-child').prependTo('#slider ul');
            $('#slider ul').css('left', '');
        });

        $('#slider ul li:nth-child('+(cen)+')').animate({
          width: smallElemsDivLen,
          height: smallElemsDivLen
        }, 200, function(){
        })

        var bigToSmallImg = $('#slider ul li:nth-child('+(cen)+') img');
        if(bigToSmallImg.width() > bigToSmallImg.height()){
          var smallWidth = bigToSmallImg.width() * (smallElemsDivLen/slider_options.$CenterLen)
          $('#slider ul li:nth-child('+(cen)+') img').animate({
              left: -(smallWidth-smallElemsDivLen)/2+"px"
            }, 200, function(){
          })
        }else{
          var smallHeight = bigToSmallImg.height() * (smallElemsDivLen/slider_options.$CenterLen)
          $('#slider ul li:nth-child('+(cen)+') img').animate({
              top: -(smallHeight-smallElemsDivLen)/2+"px"
            }, 200, function(){
          })
        }


        $('#slider ul li:nth-child('+(cen-1)+')').animate({
          width: '640px',
          height: '640px'
        }, 200, function(){
        });

        var smallToBigImg = $('#slider ul li:nth-child('+(cen-1)+') img');
        if(smallToBigImg.width() > smallToBigImg.height()){
          var bigWidth = smallToBigImg.width() * (slider_options.$CenterLen/smallElemsDivLen)
          $('#slider ul li:nth-child('+(cen-1)+') img').animate({
              left: -(bigWidth-slider_options.$CenterLen)/2+"px"
            }, 200, function(){
          })
        }else{
          var bigHeight = smallToBigImg.height() * (slider_options.$CenterLen/smallElemsDivLen)
          $('#slider ul li:nth-child('+(cen-1)+') img').animate({
              top: -(bigHeight-slider_options.$CenterLen)/2+"px"
            }, 200, function(){
          })
        }

        // 현재 이미지가 width가 큰녀석이면
        // left를 맞춰준다.
        // 작아지는 이미지는 작았을때의 image width을 알아야하고
        // 커질때 이미지는 커질때 image width를 알아야한다.

        // height가 큰녀석이면
        // top을 맞춰준다.
        // 작아지는 이미지는 작았을때의 image height을 알아야하고
        // 커질때 이미지는 커질때 image height를 알아야한다.
    };

    function moveRight(cen) {
        $('#slider ul').animate({
            left: - smallElemsDivLen
        }, 200, function () {
            $('#slider ul li:first-child').appendTo('#slider ul');
            $('#slider ul').css('left', '');
        });

        $('#slider ul li:nth-child('+(cen)+')').animate({
          width: smallElemsDivLen,
          height: smallElemsDivLen
        }, 200, function(){
        })
        var bigToSmallImg = $('#slider ul li:nth-child('+(cen)+') img');
        if(bigToSmallImg.width() > bigToSmallImg.height()){
          var smallWidth = bigToSmallImg.width() * (smallElemsDivLen/slider_options.$CenterLen)
          $('#slider ul li:nth-child('+(cen)+') img').animate({
              left: -(smallWidth-smallElemsDivLen)/2+"px"
            }, 200, function(){
          })
        }else{
          var smallHeight = bigToSmallImg.height() * (smallElemsDivLen/slider_options.$CenterLen)
          $('#slider ul li:nth-child('+(cen)+') img').animate({
              top: -(smallHeight-smallElemsDivLen)/2+"px"
            }, 200, function(){
          })
        }

        $('#slider ul li:nth-child('+(cen+1)+')').animate({
          width: '640px',
          height: '640px'
        }, 200, function(){
        })
        var smallToBigImg = $('#slider ul li:nth-child('+(cen-1)+') img');
        if(smallToBigImg.width() > smallToBigImg.height()){
          var bigWidth = smallToBigImg.width() * (slider_options.$CenterLen/smallElemsDivLen)
          $('#slider ul li:nth-child('+(cen+1)+') img').animate({
              left: -(bigWidth-slider_options.$CenterLen)/2+"px"
            }, 200, function(){
          })
        }else{
          var bigHeight = smallToBigImg.height() * (slider_options.$CenterLen/smallElemsDivLen)
          $('#slider ul li:nth-child('+(cen+1)+') img').animate({
              top: -(bigHeight-slider_options.$CenterLen)/2+"px"
            }, 200, function(){
          })
        }
    };

    $('a.control_prev').click(function () {
        moveLeft(centerElem);
    });

    $('a.control_next').click(function () {
        moveRight(centerElem);
    });
}

function imgAlignAniamtion(cen, left, top){
  var imgWidth = $('#slider ul li:nth-child('+(cen)+') img').width();
  var imgHeight = $('#slider ul li:nth-child('+(cen)+') img').height();

  if(imgWidth>imgHeight){
    $('#slider ul li:nth-child('+(cen)+') img').animate({
      left: left+"px",
    }, 200, function(){
      // console.dir(this);
    })
  }else{
    $('#slider ul li:nth-child('+(cen)+') img').animate({
      top: top+"px",
    }, 200, function(){
      // console.dir(this);
    })
  }
}

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
