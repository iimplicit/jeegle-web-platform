slider = {
    $ArrowHeight: 36, // 화살표 높이입니다.
    $CenterLen: 640, // 가운데 올 가장 큰 이미지의 한변의 길이입니다.
    $DisplayPieces: 9, // [홀수] 하나의 화면에 얼마나 보여줄지 결정하게 됩니다.
    $MaximumImageNum: 21, // [홀수] 로드하는 최대 이미지 개수입니다.
    $CenterImageNode: null, // 중앙 이미지 노드입니다.
    $CenterImageIndex: 0, // 현재 중앙 이미지 번호입니다.
    $smallElemsDivLen: 0, //이미지 하나당 너비입니다.
    $currentKeyword: []
};

var musicNum = 0;
tagFirstFlag = true;

// Tag 개수를 increase, decrease, get 하는 함수 객체입니다.
tagCounter = new TagCounter();

// 이미지를 저장하고 있는 우선순위 큐입니다.
ImageQueue = new priorityQueue(slider.$MaximumImageNum);

/*****************************************************************************/
/* Home: Event Handlers */
/*****************************************************************************/
Template.Home.events({
    "click [data-logout]": function() {
        Meteor.logout();
    },
    "submit form": function(e, tmpl) {
        e.preventDefault();
        var query = tmpl.find('input').value;
        tmpl.find('form').reset();
    },
    "click #tag-toggle-btn": function(e, tmpl) {
        inputBox = $("#tag-input-box");
        toggleBtn = $('#tag-toggle-btn');

        if (inputBox.css('visibility') == 'hidden') {
          inputBox.css('visibility','visible');
          toggleBtn.addClass('close');
          tagFirstFlag = true;
          $('#tag-input').text('태그입력');
          $('#tag-input').focus();
        } else {
          inputBox.css('visibility','hidden');
          toggleBtn.removeClass('close');
        }
    },
    "click #tag-submit": function(e, tmpl) {
        if(tagFirstFlag==true){
          return;
        }

        //if tag is not exist, tag will be undefined
        var inputBox = $('#tag-input');
        var tagWord = inputBox.text();
        inputBox.text('');
        console.log(tagWord);

        // return if there is no tag word
        var spaceRemovedTag = tagWord.replace(/\s+|\n+/g, '');
        if (spaceRemovedTag == "") return;

        // create tag div and delete
        tagCounter.incTagCount();
        createTagDiv(tagCounter.getTagCount(), tagWord)

        // 현재 태그 개수에 따라서 받아와야 할 이미지 개수를 조절합니다.
        // var howManyNodes = ImageQueue.maxSize - ImageQueue.proportion.sentence;
        // var NodesLimit = parseInt(howManyNodes/tagCounter.getTagCount()) || 1;
        var NodesLimit = parseInt(slider.$MaximumImageNum / 2)

        getImagesForTag(tagWord, 3, NodesLimit, 1);

        $('#tag-input').focus();
    },
    "keydown #tag-input": function(e, tmpl) {
        if(tagFirstFlag == true){
            tagFirstFlag = false;
            e.currentTarget.innerText = '';
        }else{
          if (e.which == 13) {
              $('#tag-submit').trigger('click');
          }
        }
    },
    "keydown #input-15": _.debounce(function(e, tmpl) {
        // 사용자 입력이 들어오면 Neo4j에 쿼리를 날립니다. debounce 함수로 적절하게 쿼리양을 조절합니다.
        e.preventDefault();

        // 사용자 입력
        var query = $('#input-15').text();
        var spaceRemovedQuery = query.replace(/\s+/g, '');

        // 태그를 제외한 문장
        var sentence = query.split('#')[0];
        var spaceRemovedSentence = sentence.replace(/\s+/g, '');

        if (!spaceRemovedSentence == "") {
            // 문장 형태소 분석 후 검색
            Meteor.call('getNounArrayBySentence', sentence, function(error, result) {
                if (!!error) {
                    throw error;
                } else {
                    // result에는 형태소 분석 결과 (현재 한글 명사, 한글 복합명사, 영어 단어 가리지 않고 모두)가 들어온다.
                    // 이 중에서 어떤 태그가 중요한지는 Neo4j만이 알고 있다.
                    slider.$currentKeyword = result;

                    // 키워드 당 대충 이 정도..
                    var NodesLimit = parseInt(slider.$MaximumImageNum / result.length) || 1;

                    // 키워드 별로 이미지를 찾아오자!
                    for (i = 0; i < result.length; i++) {
                        // 비동기를 주의해야한다. 여기서 한방에 부르고 떠난다.

                        // (태그 직접 입력한 경우) 사용자가 찾고 싶은 이미지를 직접적으로 검색합니다.
                        // 이 경우는 태그와 매우 직접적인 이미지만 가져오는 것이 좋습니다. 사용자가 그것을 의도했기 때문입니다.
                        // 태그와 직접 연결된 이미지는 필수적으로 가져오고, 연관 이미지는 최대 3개 노드 이상을 넘지 않습니다.
                        // 다만 순서는 첫번째로 연결 노드 개수 낮은것들 우선, 그 중에서는 weight 점수 높은 녀석들 우선,
                        // 그 다음부터는 edge weight 합으로 정렬합니다.
                        getImagesForTag(result[i], 3, NodesLimit, 2);
                    }
                }
            });
        }
    }, 300),
    "click #refresh-musicDeeplink": function(e, tmpl){
      // random array를 만들어서
      changeMusic();
    },
    "click #music-checkbox": function(e, tmpl){
      var checkbox = $('#music-checkbox');
      checkbox.toggleClass("btn-selected")
    }
});

function changeMusic(){
  var deeplinkArray = Session.get('musicDeeplink');
  if(musicNum==deeplinkArray.length-1){
    musicNum = 0;
  }else{
    musicNum++
  }
  var currMusic = deeplinkArray[musicNum]._source;

  if(!currMusic.trackId){
    //when it is undefined
    changeMusic(); //한개도 없는 경우만 아니면 괜찮음.
  }

  var html = '<span id="music-info" data-track-id='+currMusic.trackId+'>';
  html += currMusic.title;
  html += '-';
  html += currMusic.artist;
  html += '</span>';
  $('#music-content').html(html);
}

/*****************************************************************************/
/* Home: Helpers */
/*****************************************************************************/
Template.Home.helpers({
    images: function() {
            var tempObject = Session.get("images");
            if (!!tempObject) {
                for (var i = 0; i < tempObject.length; i++) {
                    tempObject[i].index = i;
                }
            }
            return tempObject;
        } // },
        // mainImage: function () {
        //     return TempWorkpieces.findOne({
        //         _id: Session.get("currentId")
        //     }).content[0].url;
        // }
});

/*****************************************************************************/
/* Home: Lifecycle Hooks */
/*****************************************************************************/
Template.Home.created = function () {
    //음악 먼저 10개 정도 받아옵시다. (개수 설정은 엘라스틱 서치에서 가능합니다.)
    Meteor.call('getMusicDeeplink', "10cm", function(err, result){
      if(result.length!=0){
        Session.set('musicDeeplink', result);
        changeMusic();
      }else{
        $('refresh-musicDeeplink').html('no value');
      }
    });

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
    //  참고.. image effect range
    //            grayscale : 100 + '%', // 0~ 100
    //            blur: 0 + 'px', // 10
    //            brightness: 100 + '%', // 200
    //            contrast: 100 + '%', // 200
    //            hue_rotate: 0 + 'deg', // 360
    //            opacity: 100 + '%', // 0 ~ 100
    //            invert: 0 + '%', // 0 ~ 100
    //            saturate: 100 + '%', // 0 ~ 500
    //            sepia: 0 + '%' // 0 ~ 100

    /*****************************************************************************/
    /* Image 관련 기능*/
    /*****************************************************************************/
    function imageApp() {}

    imageApp.prototype = {
        targetImage: $('#main-image'),
        mainText: $('[data-main-text]'),

        textConfig: {
            isFirstInput: true,
            isTypeableByEnter: true,
            isTypeableByAnyKey: true,
            fontsize: 40,
            fontype: 'Hanna',
            fontfamily: 'Hanna'
        },

        imageFilterType: {
            default: {
                grayscale: 0, // 100
                blur: 0, // 10
                brightness: 0, // 200
                contrast: 0, // 200
                hue_rotate: 0, // 360
                opacity: 0, // 0 ~ 100
                invert: 0, // 0 ~ 100
                saturate: 0, // 0 ~ 500
                sepia: 0 // 0 ~ 100
            },

            vintage: {
                grayscale: 0, // 100
                blur: 0, // 10
                brightness: 0, // 200
                contrast: 0, // 200
                hue_rotate: 0, // 360
                opacity: 0, // 0 ~ 100
                invert: 0, // 0 ~ 100
                saturate: 0, // 0 ~ 500
                sepia: 100 // 0 ~ 100
            },

            clarity: {
                grayscale: 100, // 100
                blur: 0, // 10
                brightness: 0, // 200
                contrast: 0, // 200
                hue_rotate: 0, // 360
                opacity: 0, // 0 ~ 100
                invert: 0, // 0 ~ 100
                saturate: 0, // 0 ~ 500
                sepia: 0 // 0 ~ 100
            },

            saturation: {
                grayscale: 0, // 100
                blur: 0, // 10
                brightness: 0, // 200
                contrast: 0, // 200
                hue_rotate: 0, // 360
                opacity: 0, // 0 ~ 100
                invert: 0, // 0 ~ 100
                saturate: 400, // 0 ~ 500
                sepia: 0 // 0 ~ 100
            },

            hue_rotate: {
                grayscale: 0, // 100
                blur: 0, // 10
                brightness: 0, // 200
                contrast: 0, // 200
                hue_rotate: 90, // 360
                opacity: 0, // 0 ~ 100
                invert: 0, // 0 ~ 100
                saturate: 0, // 0 ~ 500
                sepia: 0 // 0 ~ 100
            },

            invert: {
                grayscale: 0, // 100
                blur: 0, // 10
                brightness: 0, // 200
                contrast: 0, // 200
                hue_rotate: 0, // 360
                opacity: 0, // 0 ~ 100
                invert: 80, // 0 ~ 100
                saturate: 0, // 0 ~ 500
                sepia: 0 // 0 ~ 100
            },

            opacity: {
                grayscale: 0, // 100
                blur: 0, // 10
                brightness: 0, // 200
                contrast: 0, // 200
                hue_rotate: 0, // 360
                opacity: 25, // 0 ~ 100
                invert: 0, // 0 ~ 100
                saturate: 0, // 0 ~ 500
                sepia: 0 // 0 ~ 100
            },

            tint: {
                grayscale: 0, // 100
                blur: 0, // 10
                brightness: 0, // 200
                contrast: 0, // 200
                hue_rotate: 200, // 360
                opacity: 0, // 0 ~ 100
                invert: 0, // 0 ~ 100
                saturate: 0, // 0 ~ 500
                sepia: 100 // 0 ~ 100
            },

            conSetuSepia: {
                grayscale: 0, // 100
                blur: 0, // 10
                brightness: 0, // 200
                contrast: 140, // 200
                hue_rotate: 0, // 360
                opacity: 0, // 0 ~ 100
                invert: 0, // 0 ~ 100
                saturate: 180, // 0 ~ 500
                sepia: 60 // 0 ~ 100
            },

            old: {
                grayscale: 0, // 100
                blur: 0, // 10
                brightness: 0, // 200
                contrast: 80, // 200
                hue_rotate: -30, // 360
                opacity: 0, // 0 ~ 100
                invert: 0, // 0 ~ 100
                saturate: 120, // 0 ~ 500
                sepia: 50 // 0 ~ 100
            },

            toaster: {
                grayscale: 0, // 100
                blur: 0, // 10
                brightness: 0, // 200
                contrast: 67, // 200
                hue_rotate: -30, // 360
                opacity: 0, // 0 ~ 100
                invert: 0, // 0 ~ 100
                saturate: 250, // 0 ~ 500
                sepia: 40 // 0 ~ 100
            }
        },
        imageFilterConfig: {
            type: 'default',
            grayscale: 0, // 100
            blur: 0, // 10
            brightness: 100, // 200
            contrast: 100, // 200
            hue_rotate: 0, // 360
            opacity: 100, // 0 ~ 100
            invert: 0, // 0 ~ 100
            saturate: 100, // 0 ~ 500
            sepia: 0 // 0 ~ 100
        },
        slideOption: {
            brightnessOpt: 'value: 100, min: 0, max: 200, step: 1',
            contrastOpt: 'value: 100, min: 0, max: 200, step: 1',
            blurOpt: 'value: 0, min: 0, max: 10, step: 1'
        },

        init: function() {
            this.initTextDivPosition();
            this.setBottomFilter();
            this.addEventListener();
            this.setImageSliderEventListener();

            this.initNavbar();
            this.initMainImageWrapper();
        },

        initTextDivPosition: function() {
            var textDivXPosition = (640 - $('[data-main-text]').height()) / 2;
            $('[data-main-text]').css('top', textDivXPosition);
        },

        setBottomFilter: function() {
            $('[data-main-text]').focus();
            $('[data-bottom-type]').hide();
            $('[data-bottom-type="fontFilter"]').show();
        },

        addEventListener: function() {
            this.toggleBottomFilter();
            this.catchTextBoxEnterKeyEvent();
            this.setImageFilterType();
            this.setEditorStyle();
            this.setTextDivPosition();
            this.facebookLoginAndRasterizeHTML();
            this.setDownloadImage();
        },
        toggleBottomFilter: function() {
            // $('body').on('click', '.main-text', function (e) {
            //     e.stopPropagation();
            //     $('[data-bottom-type]').hide();
            //     $('[data-bottom-type="fontFilter"]').show();
            //
            //     $('[data-header-right-content]').empty();
            //     $('[data-header-right-content]').text("완료");
            //     $('[data-header-right-content]').attr('data-header-right-content', 'confirm');
            // })

            $('body').on('click', '#main-image', function() {
                $('[data-bottom-type]').hide();
                $('[data-bottom-type="imageFilter"]').show();
                $('[data-header-right-content]').empty();
                // $('[data-header-right-content]').text("완료");

                $('[data-header-right-content]').hide(200);
                $('[data-apply-image-filter]').show(200);
                $('[data-main-text]').css('pointer-events', 'none');
                $('#main-image-wrapper').siblings().css('visibility', 'hidden');
                $('#main-image-wrapper').css('border', '2px solid rgba(255,255,255,1)');
                // $('[data-header-right-content]').attr('data-header-right-content', 'confirm');

                // Hunjae
                $('.slider-btn').css('visibility','hidden');
            })

            $('body').on('click', '[data-apply-image-filter]', function() {
                $('[data-header-right-content]').empty();
                $('[data-header-right-content]').text("공유");
                $('[data-header-right-content]').attr('data-header-right-content', 'share');

                $('[data-header-right-content]').show(200);
                $('[data-apply-image-filter]').hide(200);
                $('[data-main-text]').css('pointer-events', 'auto');

                $('[data-bottom-type]').hide();
                $('[data-bottom-type="fontFilter"]').show();
                $('#main-image-wrapper').siblings().css('visibility', '');
                $('#main-image-wrapper').css('border', '1px solid rgba(0,0,0,0.3)');

                // Hunjae
                $('.slider-btn').css('visibility','');
            });

            $('body').on('click', '[data-header-right-content]', function() {
                // if($('[data-header-right-content]').attr('data-header-right-content') == 'confirm') {
                //     $('[data-header-right-content]').empty();
                //     $('[data-header-right-content]').text("공유");
                //     $('[data-header-right-content]').attr('data-header-right-content', 'share');
                // }

                if ($('[data-header-right-content]').attr('data-header-right-content') == 'share') {
                    $('[data-header-right-content]').empty();
                    $('[data-header-right-content]').text("홈");
                    $('[data-header-right-content]').attr('data-header-right-content', 'home');
                    $('[data-bottom-type]').hide();
                    $('[data-bottom-type="share"]').show();
                    $('[data-download-image]').show(200);

                    // #1 pointer-events를 통해 클릭을 막습니다.
                    $('#slider_box').css('pointer-events', 'none');
                    $('[data-main-text]').css('pointer-events', 'none');
                    // #2 메인이미지를 제외한 다른 이미지들을 숨겨줍니다. (hide를 사용하지 않는 이유는 hide 사용 시 이미지들의 위치가 왜곡되기 때문입니다.)
                    $('#main-image-wrapper').siblings().css('visibility', 'hidden');

                    // Hunjae
                    $('.slider-btn').css('visibility','hidden');

                } else if ($('[data-header-right-content]').attr('data-header-right-content') == 'home') {
                    // #1 pointer-events 클릭을 막은 것은 풀어줍니다.
                    $('#slider_box').css('pointer-events', 'auto');
                    $('[data-main-text]').css('pointer-events', 'auto');
                    // #2 메인이미지를 제외한 다른 이미지들을 다시 나타나게 해줍니다.
                    $('#main-image-wrapper').siblings().css('visibility', '');

                    $('[data-header-right-content]').empty();
                    $('[data-header-right-content]').text("공유");
                    $('[data-header-right-content]').attr('data-header-right-content', 'share');
                    $('[data-download-image]').hide(200);

                    // Hunjae
                    $('.slider-btn').css('visibility','');

                    imageApp.initializationByHomeBtn();
                }
            });
        },
        initializationByHomeBtn: function() {
            $('[data-main-text]').empty();
            $('[data-main-text]').text("무슨 생각을 하고 계신가요?");

            imageApp.textConfig.isFirstInput = true;
            imageApp.textConfig.isTypeableByEnter = true;
            imageApp.textConfig.isTypeableByAnyKey = true;

            imageApp.initSliderSetting();
            imageApp.initImageFilterConfig();

            imageApp.initTextDivPosition();
            imageApp.setBottomFilter();

        },

        catchTextBoxEnterKeyEvent: function() {
            $('[data-main-text][contenteditable=true]').keydown(function(e) {
                if (imageApp.textConfig.isFirstInput) {
                    imageApp.textConfig.isFirstInput = false;
                    $('[data-main-text]').empty();
                } else {
                    if (!imageApp.textConfig.isTypeableByEnter) {
                        if (e.keyCode == 13) {
                            return false;
                        }
                    }

                    if (!imageApp.textConfig.isTypeableByAnyKey) {
                        if (e.keyCode != 8) {
                            return false;
                        }
                    }
                }
            });
        },
        setEditorStyle: function() {
            $('[data-main-text-typography]').change(function() {
                var selectedFontType = $("[data-main-text-typography] option:selected").attr('data-event-change-typography');
                var selectedFontFamily = $("[data-main-text-typography] option:selected").attr('data-font-family');

                var prevClassName = $('[data-main-text]').attr('class');
                var prevClassArray = prevClassName.split(' ');
                for (var i = 0; i < prevClassArray.length; i++) {
                    if (prevClassArray[i] != 'black-bg' && prevClassArray[i] != 'no-bg' && prevClassArray[i] != 'main-text') {
                        $('[data-main-text]').removeClass(prevClassArray[i]);
                    }
                }

                $('[data-main-text]').addClass(selectedFontType);
                $('[data-main-text]').css('font-family', selectedFontFamily);

                imageApp.textConfig.fontype = selectedFontType;
                imageApp.textConfig.fontfamily = selectedFontFamily;
            });

            $('[data-change-font-size-filter]').on('change', function() {
                var fontsize;
                fontsize = $(this).val() - 0;

                $('[data-main-text]').css('font-size', fontsize);
                imageApp.textConfig.fontsize = fontsize;

                var textHeight = $('[data-main-text]').height();
                if (textHeight < 640) {
                    var textDivXPosition = (640 - textHeight) / 2;
                    $('[data-main-text]').css('top', textDivXPosition);
                }
            });

            $('[data-change-font-types]').on('change', function() {
                var isCheckBold = $("input:checkbox[data-change-font-type='bold']").is(":checked");
                var isCheckItalic = $("input:checkbox[data-change-font-type='italic']").is(":checked");
                var isCheckShadow = $("input:checkbox[data-change-font-type='shadow']").is(":checked");

                $('[data-main-text]').css('font-weight', '');
                $('[data-main-text]').css('font-style', '');
                $('[data-main-text]').css('text-shadow', '');

                if (isCheckBold) {
                    $('[data-main-text]').css('font-weight', 'bold');
                }

                if (isCheckItalic) {
                    $('[data-main-text]').css('font-style', 'italic');
                }

                if (isCheckShadow) {
                    $('[data-main-text]').css('text-shadow', '3px 3px #000');
                }
            });

            $('[data-change-font-justify]').on('click', function() {
                var selectedValue = $(this).val();
                $('[data-main-text]').css('text-align', selectedValue);
            });


        },

        setTextDivPosition: function() {
            $('[data-main-text]').keyup(function(e) {
                var height = $('[data-main-text]').height();
                var fontsize = imageApp.textConfig.fontsize;

                if (height + fontsize + 5 > 580) {
                    imageApp.textConfig.isTypeableByEnter = false;
                } else if (height + fontsize + 5 > 620) {
                    imageApp.textConfig.isTypeableByAnyKey = false;
                } else {
                    imageApp.textConfig.isTypeableByAnyKey = true;
                    imageApp.textConfig.isTypeableByEnter = true;
                }
                $('[data-main-text]').trigger('heightChange');
            });


            $('[data-main-text]').on('heightChange', function(e) {
                var textHeight = $('[data-main-text]').height();
                if (textHeight < 640) {
                    var textDivXPosition = (640 - textHeight) / 2;
                    $('[data-main-text]').css('top', textDivXPosition);
                }
            })
        },
        setCssInlineStylePropsForTextEditorDiv: function() {
            var styleProps = $('.main-text').css([
                "width", "height", "position", "top", "left", "color", "background-color", "font-size", "font-family", "text-align", "font-weight", "font-style", "line-height", "margin", "padding"
            ]);

            $.each(styleProps, function(prop, value) {
                $('.main-text').css(prop, value);
            });
        },
        facebookLoginAndRasterizeHTML: function() {
            var self = this;

            $('[data-share-facebook]').on('click', function(e) {
                // 이미지의 css 속성들을 인라인으로 넣어주는 함수 실행
                self.setCssInlineStylePropsForTextEditorDiv();

                Meteor.loginWithFacebook({
                    requestPermissions: ['user_photos', 'publish_actions']
                }, function(err) {
                    var mainText = $('.main-text')[0].outerHTML;

                    var parent = $('#main-image').parent();
                    var parentClone = parent.clone();
                    parentClone.css('width', '640px');
                    parentClone.css('height', '640px');
                    parentClone.css('bottom', '0');

                    var parentResult = parentClone[0].outerHTML;

                    var innerHtml = "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><style> @font-face{font-family: " + imageApp.textConfig.fontfamily + "; src: url(/font/" + imageApp.textConfig.fontype + ".woff);} body {padding: 0; margin: 0; overflow:hidden;} ul {margin: 0; padding: 0;} li {margin: 0; padding: 0} img { margin: 0; padding: 0; vertical-align: middle; }</style></head><body><ul id='slider'>" + parentResult + mainText + '</ul></body></html>';

                    rasterizeHTML.drawHTML(innerHtml).then(function success(renderResult) {
                        var url = getBase64Image(renderResult.image);

                        // _ImageFiles를 callback과 함께 실행시켜줍니다.
                        _ImageFiles(url, function(url) {
                            // Workpieces collection에 정보를 넣어줍니다.
                            // (향후 local storage에 넣어진 object를 불러와 넣어주는 것으로 대체)
                            var workpiece = {
                                imageUrl: url,
                                createdBy: Meteor.userId(),
                                createdAt: new Date(),
                                updatedAt: new Date()
                            }

                            Workpieces.insert(workpiece, function(err, result) {
                                if (!err) {
                                    // insert 시 반환되는 것은 inserted된 document의 _id값입니다.
                                    var _id = result;
                                    var imageUrl = Workpieces.findOne({
                                        _id: _id
                                    }).url;
                                    console.log('imageUrl =>', imageUrl);
                                    imageUrl = 'http://jeegle.io' + url;

                                    Deps.autorun(function(computation) {
                                        if (Meteor.user().services) {
                                            // 회원정보를 받아올 때 가져오는 accessToken을 가져옵니다.
                                            // 실제적으로 데이터를 서버에서 가져오는 부분은 PUB/SUB에 의해 home_controller.js와  server/publish.js에 구현되어있습니다.
                                            var accessToken = Meteor.user().services.facebook.accessToken;

                                            // 페이스북의 graph api를 POST 방식으로 콜합니다.
                                            // 아래의 FB 객체는 Facebook JavaScript SDK의 광역 객체입니다. (현재 rendered에서 이 FB객체를 불러오고 있습니다.)
                                            // *** 아래의 api의 정보는 페이스북 앱으로 등록된 "Jeegle"의 대시보드에서 Open Graph에서 확인하실 수 있습니다. ***
                                            // call 자체는 story를 참조하고,지글은 좋은 글을 좋은 이미지에 쓸 수 있도록 해주는 서비스입니다.
                                            // 첨부하는 json의 최상단은 action,
                                            // 그리고 가장 하단의 jeegle object는 object를 참조합니다.
                                            // *** jeegle object 설명 ***
                                            // og:url | <hostname>/music/:_id | _id에는 Beat의 음악 id 6자리를 넣습니다.
                                            // jeegle-web:music_info | String | Beat에서 제공하는 제목과 가수를 넣습니다. 예를 들어 "맛좋은 산 - San E"
                                            // og:image | String | 포스팅할 이미지의 URL을 넣습니다. (페이스북에서 허용하는 다른 이미지 형식도 가능합니다.)

                                            var isSharingMusic = $('[data-share-music-type="beat"]').hasClass('btn-selected'); //prop('checked');
                                            var trackId = $('#music-info').attr('data-track-id')
                                            if (isSharingMusic) {
                                                FB.api(
                                                    "/me/jeegle-web:create",
                                                    "POST", {
                                                        "access_token": accessToken,
                                                        "created_time": new Date().toISOString(),
                                                        "message": "Made in http://jeegle.io",
                                                        "fb:explicitly_shared": true,
                                                        "jeegle": {
                                                            "og:type": "jeegle-web:jeegle",
                                                            "og:url": "http://jeegle.io/music/123456",
                                                            "og:title": '♪ '+$('#music-info').text(),
                                                            "og:locale": "ko_KR",
                                                            "og:image": imageUrl,
                                                            "og:image:width": "640",
                                                            "og:image:height": "640",
                                                            "fb:app_id": "575943959175026",
                                                            "jeegle-web:music_info": "",
                                                            "al:web:url": imageUrl,
                                                            "al:web:should_fallback": true,
                                                            "al:ios:url": "bpc://landing?type=play_radio&channel_id=60&track_id=300000000000000000000000"+trackId,
                                                            "al:ios:app_store_id": "853073541",
                                                            "al:ios:app_name": "BEAT",
                                                            "al:iphone:url": "bpc://landing?type=play_radio&channel_id=60&track_id=300000000000000000000000"+trackId,
                                                            "al:iphone:app_store_id": "853073541",
                                                            "al:iphone:app_name": "BEAT",
                                                            "al:android:url": "bpc://landing?type=play_radio&channel_id=60&track_id=300000000000000000000000"+trackId,
                                                            "al:android:package": "com.beatpacking.beat",
                                                            "al:android:app_name": "BEAT"
                                                        }
                                                    },
                                                    function(response) {
                                                        console.log('this is response', response);
                                                        console.dir(response);
                                                        if (response && !response.error) {
                                                            console.log('facebook upload complete', response);
                                                            computation.stop();
                                                        }
                                                    }
                                                );
                                            } else {
                                                // 마찬가지로 향후 사용할 가능성이 있어서 남겨두었습니다.
                                                // 먼저 페이스북에서 앨범을 만들고, 그 앨범 안에 사진을 넣는 방식으로 포스팅 할 때 이런 방식으로 api 콜을 날립니다.
                                                // 나중에는 먼저 앨범이 있는지 확인하고, 날짜를 사진 이름으로 해서 올리는 방식으로 향후 개선해야 합니다.
                                                console.log(imageUrl);
                                                FB.api(
                                                    "/me/photos",
                                                    "POST", {
                                                        "access_token": accessToken,
                                                        "message": "Made in http://jeegle.io",
                                                        "url": imageUrl
                                                    },
                                                    function(response) {
                                                        if (!response || response.error) {
                                                            console.log(response.error);
                                                        } else {
                                                            console.log('facebook upload complete', response);
                                                            computation.stop();
                                                        }
                                                    }
                                                );
                                            }
                                        }
                                    });
                                } else {
                                    console.log('workpiece insert error: ', err);
                                }
                            });

                            $('[data-main-text]').on('heightChange', function(e) {
                                var textHeight = $('[data-main-text]').height();
                                if (textHeight < 640) {
                                    var textDivXPosition = (640 - textHeight) / 2;
                                    $('[data-main-text]').css('top', textDivXPosition);
                                }
                            })
                        });

                        function _ImageFiles(url, callback) {
                            // client단에서 이미지를 넣어줍니다.
                            // server단에서 이미지를 넣어주려면 base64 encoded data uri가 websocket을 통해 서버까지 올라가야하므로
                            // 또 다른 작업 공수를 야기시킵니다. 라이브러리에서도 client단에서 이미지를 넣어주기를
                            // 권장하고 있습니다.

                            ImageFiles.insert(url, function(err, fileObj) {
                                // 비동기 문제를 해결하기 위해 아래의 연산을 수행합니다.
                                // 이는 .on("stored", callback) 이벤트 핸들러가 아직 client단에는 마련되지 않았다고
                                // 공식적으로 저자가 밝히고 있는 비동기 문제를 해결하기 위함입니다.
                                // (즉, 언제 실제로 파일이 저장되었는지를 이벤트로 보내주지 않음.)
                                // 에러 체크
                                if (!err) {
                                    // setInterval을 find에 넣어줍니다.
                                    var find = setInterval(function() {
                                        var url = fileObj.url();
                                        if (!!url) {
                                            // 만약 url이 null이 아닐 경우(비동기 문제가 해결 됬을 경우)
                                            // setInterval을 멈춰줍니다.
                                            clearInterval(find);
                                            // 처음에 _ImageFiles에서 받았던 callback을 불러줍니다.
                                            return callback(url);
                                        }
                                    }, 100);
                                } else {
                                    console.log('file insert error: ', err);
                                }
                            });
                        }
                    }, function error(err) {
                        console.log('rasterization failed: ', err);
                    });
                });
            });


        },


        setImageFilterType: function() {

            var self = this;

            $('body').on('click', '[data-preset]', function() {
                var selectedFilterType = $(this).attr('data-preset');
                self.imageFilterConfig.type = selectedFilterType;

                if (selectedFilterType == 'default') {
                    self.initSliderSetting();
                    self.initImageFilterConfig();
                }

                self.setImageFilter();
            });
        },

        setImageFilter: function() {
            var selectedFilterType = this.imageFilterConfig.type;

            $('#main-image').css("filter",
                'grayscale(' + (this.imageFilterConfig.grayscale + this.imageFilterType[selectedFilterType].grayscale) + '%)' +
                'blur(' + (this.imageFilterConfig.blur + this.imageFilterType[selectedFilterType].blur) + 'px)' +
                'brightness(' + (this.imageFilterConfig.brightness + this.imageFilterType[selectedFilterType].brightness) + '%)' +
                'contrast(' + (this.imageFilterConfig.contrast + this.imageFilterType[selectedFilterType].contrast) + '%)' +
                'hue-rotate(' + (this.imageFilterConfig.hue_rotate + this.imageFilterType[selectedFilterType].hue_rotate) + 'deg)' +
                'opacity(' + (this.imageFilterConfig.opacity + this.imageFilterType[selectedFilterType].opacity) + '%)' +
                'invert(' + (this.imageFilterConfig.invert + this.imageFilterType[selectedFilterType].invert) + '%)' +
                'saturate(' + (this.imageFilterConfig.saturate + this.imageFilterType[selectedFilterType].saturate) + '%)' +
                'sepia(' + (this.imageFilterConfig.sepia + this.imageFilterType[selectedFilterType].sepia) + '%)'
            );

            $('#main-image').css("-webkit-filter",
                'grayscale(' + (this.imageFilterConfig.grayscale + this.imageFilterType[selectedFilterType].grayscale) + '%)' +
                'blur(' + (this.imageFilterConfig.blur + this.imageFilterType[selectedFilterType].blur) + 'px)' +
                'brightness(' + (this.imageFilterConfig.brightness + this.imageFilterType[selectedFilterType].brightness) + '%)' +
                'contrast(' + (this.imageFilterConfig.contrast + this.imageFilterType[selectedFilterType].contrast) + '%)' +
                'hue-rotate(' + (this.imageFilterConfig.hue_rotate + this.imageFilterType[selectedFilterType].hue_rotate) + 'deg)' +
                'opacity(' + (this.imageFilterConfig.opacity + this.imageFilterType[selectedFilterType].opacity) + '%)' +
                'invert(' + (this.imageFilterConfig.invert + this.imageFilterType[selectedFilterType].invert) + '%)' +
                'saturate(' + (this.imageFilterConfig.saturate + this.imageFilterType[selectedFilterType].saturate) + '%)' +
                'sepia(' + (this.imageFilterConfig.sepia + this.imageFilterType[selectedFilterType].sepia) + '%)'
            );
        },

        setImageSliderEventListener: function() {
            this.initSliderSetting();
        },

        initSliderSetting: function() {

            var self = this;

            $('[data-event-slide-filter]').on('change', 'input', function() {
                var filter, value;
                filter = $(this).data('filter');
                value = $(this).val() - 0;
                self.imageFilterConfig[filter] = value;
                self.setImageFilter();
            });
        },

        initImageFilterConfig: function() {
            this.imageFilterConfig = {
                    type: 'default',
                    grayscale: 0, // 100
                    blur: 0, // 10
                    brightness: 100, // 200
                    contrast: 100, // 200
                    hue_rotate: 0, // 360
                    opacity: 100, // 0 ~ 100
                    invert: 0, // 0 ~ 100
                    saturate: 100, // 0 ~ 500
                    sepia: 0 // 0 ~ 100
                },

                $("input[data-filter=brightness]").val(100);
            $("input[data-filter=contrast]").val(100);
            $("input[data-filter=blur]").val(0);
        },

        initNavbar: function() {
            $('[data-nav-top]').width($('body').height());
        },
        initMainImageWrapper: function() {
            // var offset = $('#main-image-wrapper').offset();
            // $('[data-main-image-wrapper]').offset({
            //   top: offset.top,
            //   left: offset.left
            // })
        },
        setDownloadImage: function(){
            var self = this;

            $('[data-download-image]').on('click', function(e){
                self.setCssInlineStylePropsForTextEditorDiv();

                var mainText = $('.main-text')[0].outerHTML;

                var parent = $('#main-image').parent();
                var parentClone = parent.clone();
                parentClone.css('width', '640px');
                parentClone.css('height', '640px');
                parentClone.css('bottom', '0');

                var parentResult = parentClone[0].outerHTML;

                var innerHtml = "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><style> @font-face{font-family: " + self.textConfig.fontfamily + "; src: url(/font/" + self.textConfig.fontype + ".woff);} body {padding: 0; margin: 0; overflow:hidden;} ul {margin: 0; padding: 0;} li {margin: 0; padding: 0} img { margin: 0; padding: 0; vertical-align: middle; }</style></head><body><ul id='slider'>" + parentResult + mainText + '</ul></body></html>';

                rasterizeHTML.drawHTML(innerHtml).then(function success(renderResult) {
                    var url = getBase64Image(renderResult.image);
                    var a = $("<a>")
                        .attr("href", url)
                        .attr("download", "jeegle.png")
                        .appendTo("body");

                    a[0].click();

                    a.remove();
                }, function error(err) {
                    console.log('rasterization failed: ', err);
                });
            });
        }
    }

    /*****************************************************************************/
    /* application init method
     /*****************************************************************************/
    var imageApp = new imageApp();
    imageApp.init();

    /*****************************************************************************/
    /* Hunjae
     /*****************************************************************************/
    $('#tagBox').on('click', '[data-tag]', function(e) {
        // prevent a tag default event
        e.preventDefault();

        // select tag element
        var selectedWord = $(this).attr('data-tag');

        // delete tag element
        this.parentElement.removeChild(this);

        // decrease tag count
        tagCounter.decTagCount();

        // reload images (delete selected images)
        getRandomImages(parseInt(slider.$MaximumImageNum / 4));
    });

    // Auto focus when page is loaded
    $('#input-15').focus();

    // 이미지를 Neo4j database에서 받아옵니다. 최초의 중앙 이미지 번호를 저장합니다.
    slider.$CenterImageIndex = parseInt(slider.$MaximumImageNum / 2); // + 1; => heap index 0 to (MaximumImageNum-1)
    getRandomImages(slider.$MaximumImageNum);
};

function getImagesForTag(tagWord, edgeScope, NodesLimit, type) {
    // Neo4j로 태그 쿼리를 날립니다.

    Meteor.neo4j.call('getImagesForTag', {
            tagWord: tagWord,
            edgeScope: edgeScope,
            NodesLimit: NodesLimit
        },
        function(err, data) {
            if (err) throw err;

            if (data.i.length != 0) {
                // sentence 쿼리 결과가 너무 늦은 경우
                if (type == 2 /*sentence*/ && slider.$currentKeyword.indexOf(data.t[0].word) == -1) {
                    return;
                }

                Images = data.i;

                pushImages(Images, 0, data.t, type); //무슨 태그에 의해 왔는지, 태그에 의해 검색된 것은 몇 점인지

                restoreCenterImage(type);

                Session.set("images", ImageQueue.heap);
                Tracker.flush();
                Tracker.afterFlush(function() {
                    setImagePosition(slider);
                })
            } else {
                console.log("결과가 없습니다.");
            }
        })
}

function getRandomImages(NumOfImages) {
    // 이미지를 Neo4j database에서 받아옵니다.
    console.log('getRandomImage');
    var start = new Date();
    var startTime = start.getTime();

    Meteor.neo4j.call('getRandomImages', {
            NumImages: NumOfImages
        },
        function(err, data) {
            if (err) throw err;
            var end = new Date();
            var endTime = end.getTime();
            $('.before-load').css('display', 'none');

            var diffTime = new Date(endTime - startTime);
            console.log(diffTime.getSeconds() + '.' + diffTime.getMilliseconds() + ' seconds takes to get ' + slider.$MaximumImageNum + ' Images');

            if (data.i.length != 0) {
                Images = data.i;

                // console.log(Images.length+'개의 랜덤 이미지를 가져왔습니다.');
                pushImages(Images, 0 /*priority*/ , data.t, 0 /*type:random*/ );

                if (NumOfImages == slider.$MaximumImageNum) {
                    // 처음이에요.
                    slider.$CenterImageNode = ImageQueue.heap[slider.$CenterImageIndex]; //전부 다 바꾸는 경우

                    // 세션에 새롭게 생성된 이미지 큐를 넣어줍니다.
                    Session.set("images", ImageQueue.heap);
                    Tracker.flush();
                    Tracker.afterFlush(function() {
                        setJeegleSlider();
                        setImagePosition(slider);
                    })
                } else {
                    restoreCenterImage(0 /*type: random*/ );

                    // 세션에 새롭게 생성된 이미지 큐를 넣어줍니다.
                    Session.set("images", ImageQueue.heap);
                    Tracker.flush();
                    Tracker.afterFlush(function() {
                        setImagePosition(slider);
                    })
                }
            } else {
                console.log("결과가 없습니다.");
            }
        });
}

function setJeegleSlider() {
    // slider_box
    //  slider
    //    slider ul
    //       slider ul li
    console.log('setJeegleSlider called');
    $('.slider_box').css('display', 'block');

    // I said it's odd.
    //(ex) 21개면 centerElem은 11
    centerElem = parseInt(slider.$MaximumImageNum / 2); // + 1;
    slider.$CenterImageIndex = centerElem;
    // console.log('center:' + centerElem);

    // slider의 너비와 높이를 받아옵니다.
    windowWidth = $('#slider_box').width();
    windowHeight = slider.$CenterLen;

    // 작은 이미지들 너비 설정
    smallElemsWholeWidth = windowWidth - slider.$CenterLen; // 작은 이미지의 전체 길이
    smallElemsDivLen = parseInt(smallElemsWholeWidth / (slider.$DisplayPieces - 1)); // 작은 이미지의 각자 길이 width=height
    slider.$smallElemsDivLen = smallElemsDivLen;

    $('[data-main-image-wrapper]').css('left', smallElemsDivLen * parseInt(slider.$DisplayPieces / 2));
    $('[data-main-image-wrapper]').css('display', 'block');

    // slider 너비 조절
    var sliderWidth = smallElemsDivLen * (slider.$MaximumImageNum - 1) + slider.$CenterLen;
    $('#slider').css('width', sliderWidth)

    $('.image-div').css('width', smallElemsDivLen);
    $('.image-div').css('height', smallElemsDivLen);

    $('#slider').css('top', (slider.$CenterLen - smallElemsDivLen) / 2)

    // slider ul 또한 동일한 height를 주게 됩니다.
    $('#slider').css('height', smallElemsDivLen);

    // 중앙 엘리먼트 크기 설정
    var centralElement = $('#slider li:nth-child(' + parseInt(centerElem + 1) + ')');
    centralElement.css('width', slider.$CenterLen);
    centralElement.css('height', slider.$CenterLen);
    centralElement.css('bottom', (slider.$CenterLen - smallElemsDivLen) / 2);
    centralElement[0].children[0].id = 'main-image';
    centralElement[0].id = 'main-image-wrapper';

    // 배경이미지 설정
    backgroundStyle = "url('" + centralElement[0].children[0].src + "')";
    $('.body-background').css('background-image', backgroundStyle);

    // 가운데 정렬!
    var leftPosition = -(sliderWidth - windowWidth) / 2
    $('#slider').css('left', leftPosition);
    $('#slider').css('width', sliderWidth + 200); // This is margin for image load duration

    // 버튼 위치 설정
    $('a.control_prev').css('top', (slider.$CenterLen - slider.$ArrowHeight) / 2 + "px");
    $('a.control_next').css('top', (slider.$CenterLen - slider.$ArrowHeight) / 2 + "px");

    function moveLeft(cen) {
        var bigToSmall = cen + 1;
        var smallToBig = cen;

        $('#slider').animate({
            left: leftPosition + smallElemsDivLen
        }, 200, function() {
            $('#slider li:last-child').prependTo('#slider');
            $('#slider').css('left', leftPosition);
        });

        var bigToSmallLi = $('#slider li:nth-child(' + (bigToSmall) + ')')
        bigToSmallLi.animate({
            width: smallElemsDivLen,
            height: smallElemsDivLen,
            bottom: 0
        }, 200, function() {})

        var bigToSmallImg = $('#slider li:nth-child(' + (bigToSmall) + ') img');
        bigToSmallImg.attr('id', '');
        bigToSmallImg.parent().attr('id', '');

        if (bigToSmallImg[0].naturalWidth > bigToSmallImg[0].naturalHeight) {
            var smallWidth = parseInt(bigToSmallImg[0].style.left.split('p')[0]) * (smallElemsDivLen / slider.$CenterLen)
            $('#slider li:nth-child(' + (bigToSmall) + ') img').animate({
                left: smallWidth+"px"
            }, 200, function() {})
        } else {
            var smallHeight = parseInt(bigToSmallImg[0].style.top.split('p')[0]) * (smallElemsDivLen / slider.$CenterLen)
            $('#slider li:nth-child(' + (bigToSmall) + ') img').animate({
                top: smallHeight+"px"
            }, 200, function() {})
        }

        var smallToBigLi = $('#slider li:nth-child(' + (smallToBig) + ')')
        smallToBigLi.animate({
            width: slider.$CenterLen,
            height: slider.$CenterLen,
            bottom: (slider.$CenterLen - smallElemsDivLen) / 2
        }, 200, function() {});

        var smallToBigImg = $('#slider li:nth-child(' + (smallToBig) + ') img');
        smallToBigImg.attr('id', 'main-image');
        smallToBigImg.parent().attr('id', 'main-image-wrapper');

        if (smallToBigImg[0].naturalWidth > smallToBigImg[0].naturalHeight) {
          // var bigWidth = smallToBigImg[0].offsetWidth * (slider.$CenterLen / smallElemsDivLen)
          var bigWidth = parseInt(smallToBigImg[0].style.left.split('p')[0]) * (slider.$CenterLen / smallElemsDivLen)
            $('#slider li:nth-child(' + (smallToBig) + ') img').animate({
                left: bigWidth+"px"
            }, 200, function(e) {})
        } else {
          // var bigHeight = smallToBigImg[0].offsetHeight  * (slider.$CenterLen / smallElemsDivLen)
          var bigHeight = parseInt(smallToBigImg[0].style.top.split('p')[0])  * (slider.$CenterLen / smallElemsDivLen)
            $('#slider li:nth-child(' + (smallToBig) + ') img').animate({
                top: bigHeight+"px"
            }, 200, function(e) {})
        }

        // 가운데 이미지 번호를 가지고 있습니다.
        slider.$CenterImageIndex = parseInt(smallToBigLi.attr('data-num')); //this image number
        slider.$CenterImageNode = ImageQueue.heap[slider.$CenterImageIndex];

        // 배경이미지 설정
        backgroundStyle = "url('" + smallToBigImg[0].src + "')";
        $('.body-background').css('background-image', backgroundStyle);
    };

    function moveRight(cen) {
        var bigToSmall = cen + 1;
        var smallToBig = cen + 2;

        $('#slider').animate({
            left: leftPosition - smallElemsDivLen
        }, 200, function() {
            $('#slider li:first-child').appendTo('#slider');
            $('#slider').css('left', leftPosition);
        });

        var bigToSmallLi = $('#slider li:nth-child(' + (bigToSmall) + ')');
        bigToSmallLi.animate({
            width: smallElemsDivLen,
            height: smallElemsDivLen,
            bottom: 0
        }, 200, function() {})

        var bigToSmallImg = $('#slider li:nth-child(' + (bigToSmall) + ') img');
        bigToSmallImg.attr('id', '');
        bigToSmallImg.parent().attr('id', '');

        if (bigToSmallImg[0].naturalWidth > bigToSmallImg[0].naturalHeight) {
            var smallWidth = parseInt(bigToSmallImg[0].style.left.split('p')[0]) * (smallElemsDivLen / slider.$CenterLen)
            $('#slider li:nth-child(' + (bigToSmall) + ') img').animate({
                left: smallWidth+"px"
            }, 200, function() {})
        } else {
            var smallHeight = parseInt(bigToSmallImg[0].style.top.split('p')[0]) * (smallElemsDivLen / slider.$CenterLen)
            $('#slider li:nth-child(' + (bigToSmall) + ') img').animate({
                top: smallHeight+"px"
            }, 200, function() {})
        }

        var smallToBigLi = $('#slider li:nth-child(' + (smallToBig) + ')');
        smallToBigLi.animate({
                width: slider.$CenterLen, //'640px',
                height: slider.$CenterLen, //'640px',
                bottom: (slider.$CenterLen - smallElemsDivLen) / 2
            }, 200, function() {})
            // 가운데 이미지 번호를 가지고 있습니다.
        slider.$CenterImageIndex = parseInt(smallToBigLi.attr('data-num')); //this image number
        slider.$CenterImageNode = ImageQueue.heap[slider.$CenterImageIndex];

        var smallToBigImg = $('#slider li:nth-child(' + (smallToBig) + ') img');
        smallToBigImg.attr('id', 'main-image');
        smallToBigImg.parent().attr('id', 'main-image-wrapper');

        // if (smallToBigImg[0].naturalWidth > smallToBigImg[0].naturalHeight) {
        //   var bigWidth = Math.round(smallToBigImg[0].width * (slider.$CenterLen / smallElemsDivLen));
        //   // var bigWidth = parseInt(smallToBigImg[0].style.left.split('p')[0]) * (slider.$CenterLen / smallElemsDivLen)
        //     $('#slider li:nth-child(' + (smallToBig) + ') img').animate({
        //       left: -(bigWidth-slider.$CenterLen)/2+"px"
        //     }, 200, function(e) {
        //     })
        // } else {
        //   // var bigHeight = smallToBigImg[0].offsetHeight  * (slider.$CenterLen / smallElemsDivLen)
        //   var bigHeight = Math.round(smallToBigImg[0].height * (slider.$CenterLen / smallElemsDivLen));
        //     $('#slider li:nth-child(' + (smallToBig) + ') img').animate({
        //       top: -(bigHeight-slider.$CenterLen)/2+"px"
        //     }, 200, function(e) {
        //     })
        // }

        if (smallToBigImg[0].naturalWidth > smallToBigImg[0].naturalHeight) {
          var bigWidth = parseInt(smallToBigImg[0].style.left.split('p')[0]) * (slider.$CenterLen / smallElemsDivLen)
            $('#slider li:nth-child(' + (smallToBig) + ') img').animate({
                left: bigWidth+"px"
            }, 200, function(e) {
                console.log(smallToBigImg[0].style.left)
                smallToBigImg[0].style.left = -(smallToBigImg[0].offsetWidth - slider.$CenterLen)/2
            })
        } else {
          // var bigHeight = smallToBigImg[0].offsetHeight  * (slider.$CenterLen / smallElemsDivLen)
          var bigHeight = parseInt(smallToBigImg[0].style.top.split('p')[0])  * (slider.$CenterLen / smallElemsDivLen)
            $('#slider li:nth-child(' + (smallToBig) + ') img').animate({
                top: bigHeight+"px"
            }, 200, function(e) {
              console.log(smallToBigImg[0].style.top)
              smallToBigImg[0].style.top = -(smallToBigImg[0].offsetHeight - slider.$CenterLen)/2
            })
        }

        // 배경이미지 설정
        backgroundStyle = "url('" + smallToBigImg[0].src + "')";
        $('.body-background').css('background-image', backgroundStyle);
    };

    // hunjae: 왜 클릭이벤트 여러번 안먹지?
    $('a.control_prev').click(_.debounce(function(e) {
        e.preventDefault();
        moveLeft(centerElem);
    }, 220));

    $('a.control_next').click(_.debounce(function(e) {
        e.preventDefault();
        moveRight(centerElem);
    }, 220));
};

function setImagePosition(slider) {
    var slider_images = document.getElementsByName('images_in_belt');

    _.forEach(slider_images, function(img) {
        if (img.complete) {
            onLoadImage(img);
        } else {
            img.onload = onLoadImage;
        }
    })

    function onLoadImage(img) {
        if (this != window) {
            //onload 이벤트 실행시
            img = this;
        }

        var naturalWidth = img.naturalWidth;
        var naturalHeight = img.naturalHeight; //real image size

        var imgWidth = img.width;
        var imgHeight = img.height;

        if (naturalWidth > naturalHeight) {
            // 가로가 더 긴 경우
            img.style.height = "100%";
            img.style.width = 'auto';
            img.style.top = 0;
            if (img.id == 'main-image') {
                img.style.left = -(img.offsetWidth - slider.$CenterLen) / 2 + "px";
            } else {
                img.style.left = -(img.offsetWidth - slider.$smallElemsDivLen) / 2 + "px";
            }
        } else {
            // 세로가 더 긴 경우
            img.style.width = '100%';
            img.style.height = 'auto';
            img.style.left = 0;
            if (img.id == 'main-image') {
                img.style.top = -(img.offsetHeight - slider.$CenterLen) / 2 + "px";
            } else {
                img.style.top = -(img.offsetHeight - slider.$smallElemsDivLen) / 2 + "px";
                // img.style.top = 0;
            }
        }
    }
}

Template.Home.destroyed = function() {};

function getBase64Image(img) {
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to
    // guess the original format, but be aware the using "image/jpg"
    // will re-encode the image.
    var dataURL = canvas.toDataURL("image/png");

    return dataURL;
    // return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

function createTagDiv(tagNum, tagWord) {
    var html = '';
    // 보통 다른 id줄때 id? name? val? 뭐로 줌?
    html += '<li><span id="tagNum-' + tagNum + '" class="tag-filter-item" data-tag=' + tagWord + '>';
    html += tagWord;
    html += '</span></li>';

    $('#tagBox').append(html);
}


function pushImages(Images, priority, tag, type) {
    var ImageArray = new Array();

    if (ImageQueue.isFull()) {
        ImageQueue.decAllPriority();
    }
    for (k = 0; k < Images.length; k++) {
        var duplicatedFlag = false;
        for (j = 0; j < ImageQueue.heap.length; j++) {
            if (ImageQueue.heap[j].data.thumbnailImageUrl == Images[k].thumbnailImageUrl) {
                duplicatedFlag = true;
                break;
            }
        }
        if (duplicatedFlag) continue;

        ImageQueue.push(Images[k], priority, tag[k], type);
    }
}

// 사용자가 #태그를 다는 개수를 셉니다.
function TagCounter() {
    var cnt = 0;
    this.decTagCount = function() {
        cnt--;
    }
    this.incTagCount = function() {
        cnt++;
    }
    this.getTagCount = function() {
        return cnt;
    }
}


function restoreCenterImage(type) {
    if (type == 0) {
        ImageQueue.proportion.random--;
    } else if (type == 1) {
        ImageQueue.proportion.tag--;
    } else {
        ImageQueue.proportion.sentence--;
    }

    if (slider.$CenterImageNode.type == 0) {
        ImageQueue.proportion.random++;
    } else if (slider.$CenterImageNode.type == 1) {
        ImageQueue.proportion.tag++;
    } else {
        ImageQueue.proportion.sentence++;
    }

    if (slider.$CenterImageNode != null) {
        ImageQueue.heap[slider.$CenterImageIndex] = slider.$CenterImageNode;
    }
}
