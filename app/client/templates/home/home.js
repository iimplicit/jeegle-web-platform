function Node(data, priority){
  this.data = data;
  this.priority = priority;
}
// What's wrong with you?
// Node.prototype.getPriority = function(){return this.priority;}
Node.prototype.toString = function(){return this.priority;}

function priorityQueue(maxSize){
  this.heap = [];
  this.maxSize = maxSize;
}

// We assume priority == score. it means that data with lower score will pop
priorityQueue.prototype = {

  push: function(data, priority) {
    if(this.heap.length==this.maxSize){
        console.log('we are full queue now. pop: '+this.pop());
    };
    var node = new Node(data, priority); //create node
    var i = this.heap.push(node) //it will return last index of heap
    this.bubble(i-1)
  },
  pop: function() {
    var topVal = this.heap[0].data;
    //we don't need to deal with no data.
    this.heap[0] = this.heap.pop(); //get last value
    this.sink(0);
    return topVal;
  },
  bubble: function(i){
    while(i>0){
      var parentIndex = (i-1) >> 1;

      if(!this.higherPriority(i, parentIndex)) break;

      this.swap(i, parentIndex);
      i = parentIndex;
    }
  },
  sink: function(i){
    while((i*2)+1 < this.heap.length){
      leftChildIndex = (i*2)+1;
      var childIndex = 0;

      if(leftChildIndex+1 == this.heap.length){
        // if there is only leftChild
        childIndex = leftChildIndex;
      }else{
        // there are both left and right child
        var leftHigher = this.higherPriority(leftChildIndex, leftChildIndex+1);
        childIndex = leftHigher? leftChildIndex : leftChildIndex+1;
      }

      if (this.higherPriority(i,childIndex)) break;

      this.swap(i, childIndex);
      i = childIndex;
    }
  },
  swap: function(i, j){
    var temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;

    /*
    // swap without temp. But is it efficient enough?
    this.heap[i] = this.heap[i] + this.heap[j]
    this.heap[j] = this.heap[i] - this.heap[j]
    this.heap[i] = this.heap[i] - this.heap[j]
    */
  },
  higherPriority: function(i, j){
    return this.heap[i].priority < this.heap[j].priority
  }
}


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
tagCounter = new TagCounter();

MaximumImageNum = 100; // 사용자이 입력에 대응하기 위해 기본적으로 우리가 가지고 있어야하는 40개의 이미지
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
    e.preventDefault();

    // 사용자 입력
    var query = tmpl.find('input').value;

    // 태그 작성 중엔 쿼리날리지 않아도 된다.
    var writingTagFlag = false;
    var tagFlag = false;

    // 태그를 제외한 문장
    sentence = query.split('#')[0];

    // 아무 것도 없는 경우
    if(query==""){
      //현재 이미지 유지
      return;
    }else if(!query.includes('#')){
      // 문장만 있는 경우
      console.log('only sentence');
      // 문장 전체를 쿼리로 날린 다음, 이미지 점수별 Sorting
      // 일단은 모두 같다고 가정하고, 같은 개수 만큼 정렬

    }else{
      // 태그 들어왔다. 엔터칠때까진 아무것도 안해도 됨.
      writingTagFlag = true;
      console.log(e.which);
      if(e.which==13){

        tag = query.split('#')[1]; //if tag is not exist, tag will be undefined
        console.log('There is a tag');

        // create tag div and delete
        tagCounter.incTagCount();
        createTagDiv(tagCounter.getTagCount(), tag)
        tmpl.find('input').value = sentence;

        spaceRemoveSentence = sentence.replace(/\s+/g, '');
        tagFlag=true;

        if(spaceRemoveSentence == ""){
          // 태그만 있는 경우
          console.log('only tag')
          // tag 100% => 여러개 tag n빵.

        }else{
          // 태그와 문장 둘다 있는 경우
          // tag 50% 나머지 50%
          console.log('both tag and sentence')

        }
        writingTagFlag = false;
      }
    }

    if(writingTagFlag==false){
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
                for(k=0;k<Images.length;k++){
                  //이미 이미지 어레이에 들어가있으면 또 넣을 필요가 없다.
                  // queue.heap.filter(function (Node, word) {return Node.data.p == word});
                  // if(ImageQueue.heap.indexOf(Images[k])!=-1) continue;
                  ImageQueue.push(Images[k], k);
                  // ImageArray.push(Images[k]);
                }
                console.log('imageQueue!!!');
                console.dir(ImageQueue);

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

      // (태그 직접 입력한 경우) 사용자가 찾고 싶은 이미지를 직접적으로 검색합니다.
      // 이 경우는 태그와 매우 직접적인 이미지만 가져오는 것이 좋습니다. 사용자가 그것을 의도했기 때문입니다.
      // 태그와 직접 연결된 이미지는 필수적으로 가져오고, 연관 이미지는 최대 5개 노드 이상을 넘지 않습니다.
      // 다만 순서는 첫번째로 연결 노드 개수 낮은것들 우선, 그 중에서는 weight 점수 높은 녀석들 우선,
      // 그 다음부터는 edge weight 합으로 정렬합니다.
      if(tagFlag){
        Meteor.neo4j.call('searchImagesForTag', {tagWord:tag, edgeScope:3, NodesLimit:20}, function(err,data){
          Images = data.i;
          for(k=0;k<Images.length;k++){
            //이미 이미지 어레이에 들어가있으면 또 넣을 필요가 없다.
            // if(ImageArray.indexOf(Images[k])!=-1) continue;
            ImageQueue.push(Images[k], k)
          }
          Session.set("images", ImageQueue.heap);
        })
      }
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

    Sketches._collection.update({
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
    return Sketches.findOne({
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

  Sketches._collection.insert(firstSketch, function(err, result) {
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
      for(k=0;k<AllImages.length;k++){
        //이미 이미지 어레이에 들어가있으면 또 넣을 필요가 없다.
        ImageQueue.push(AllImages[k], 0)
      }
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
  html += '<li><a href="#" id="tagNum-'+tagNum+'">';
  html += tagWord;
  html += '</a></li>';

  $('#tagBox').append(html);
}
