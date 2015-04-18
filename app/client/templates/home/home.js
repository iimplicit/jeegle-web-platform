slider_options = {
    $ArrowHeight: 30,   // 화살표 높이입니다.
    $CenterLen: 640,    // 가운데 올 가장 큰 이미지의 한변의 길이입니다.
    // $NestedWidth: 20,   // 가운데 사진과 겹치는 부분의 px 길이입니다.
    $DisplayPieces: 21,  // 하나의 화면에 얼마나 보여줄지 결정하게 됩니다.
    $smallElemsDivLen: 0
};

// Tag 개수를 increase, decrease, get 하는 함수 객체입니다.
tagCounter = new TagCounter();

// 이미지를 저장하고 있는 우선순위 큐입니다.
MaximumImageNum = 21; //hunjae: setting으로 뺄것인가.
ImageQueue = new priorityQueue(MaximumImageNum);
CenterImageNum = 0;

/*****************************************************************************/
/* Home: Event Handlers */
/*****************************************************************************/
Template.Home.events({
    "click [data-login]": function () {
        Meteor.loginWithFacebook();
    },
    "click [data-logout]": function () {
        Meteor.logout();
    },
    "submit form": function (e, tmpl) {
        e.preventDefault();
        var query = tmpl.find('input').value;
        tmpl.find('form').reset();
    },
    "click #tag-toggle-btn": function(e, tmpl){
      inputBox = $("#tag-input-box");
      toggleBtn = $('#tag-toggle-btn');

      inputBox.toggle();

      if(inputBox.css('display')=='none'){
        toggleBtn.val('+');
      }else{
        toggleBtn.val('x');
      }
    },
    "click #tag-submit": function(e, tmpl){
      //if tag is not exist, tag will be undefined
      var inputBox = $('#tag-input');
      var tag = inputBox.val();
      inputBox.val('');

      // return if there is no tag word
      var spaceRemovedTag = tag.replace(/\s+/g, '');
      if (spaceRemovedTag == "") return;

      // create tag div and delete
      tagCounter.incTagCount();
      createTagDiv(tagCounter.getTagCount(), tag)

      // 현재 태그 개수에 따라서 받아와야 할 이미지 개수를 조절합니다.
      var howManyNodes = ImageQueue.maxSize - ImageQueue.proportion.sentence;
      var NodesNum = parseInt(howManyNodes/tagCounter.getTagCount()) || 1;

      // Neo4j로 태그 쿼리를 날립니다.
      Meteor.neo4j.call('searchImagesForTag', {tagWord: tag, edgeScope: 3, NodesLimit: NodesNum}, function (err, data) {
          // 이미지를 받아온겁니다.
          Images = data.i;
          if(Images.length!=0){
            console.dir(Images);
            console.log(Images.length+'개의 결과를 가져왔습니다.')

            pushImages(Images, tagCounter.getTagCount(), data.t, 1); //무슨 태그에 의해 왔는지, 태그에 의해 검색된 것은 몇 점인지

            restoreCenterImage(1);
            // ImageQueue.proportion.tag--;
            //
            // // 다시 바꿔주자.
            // if(CenterImageNode.type==0){
            //   ImageQueue.proportion.random++;
            // }else if(CenterImageNode.type==1){
            //   ImageQueue.proportion.tag++;
            // }else{
            //   ImageQueue.proportion.sentence++;
            // }
            // ImageQueue.heap[CenterImageNum] = CenterImageNode;

            Session.set("images", ImageQueue.heap);
            Tracker.flush();
            Tracker.afterFlush(function(){
                  setImagePosition(slider_options);
            })
          }else{
            console.log("결과가 없습니다.");
          }
      })
    },
    "keypress #tag-input": function(e, tmpl){
      if(e.which == 13){
        $('#tag-submit').trigger('click');
      }
    },
    "keypress #input-15": _.debounce(function (e, tmpl) {
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
            Meteor.call('getNounArrayBySentence', sentence, function (error, result) {
                if (!!error) {
                    throw error;
                } else {
                    // result에는 형태소 분석 결과 (현재 한글 명사, 한글 복합명사, 영어 단어 가리지 않고 모두)가 들어온다.
                    // 이 중에서 어떤 태그가 중요한지는 Neo4j만이 알고 있다.
                    console.log("형태소 분석 결과: ")
                    console.dir(result);

                    // 키워드 당 대충 이 정도..
                    howManyEach = parseInt(MaximumImageNum / result.length);

                    // 키워드 별로 이미지를 찾아오자!
                    for (i = 0; i < result.length; i++) {
                        // 비동기를 주의해야한다. 여기서 한방에 부르고 떠난다.

                        // (태그 직접 입력한 경우) 사용자가 찾고 싶은 이미지를 직접적으로 검색합니다.
                        // 이 경우는 태그와 매우 직접적인 이미지만 가져오는 것이 좋습니다. 사용자가 그것을 의도했기 때문입니다.
                        // 태그와 직접 연결된 이미지는 필수적으로 가져오고, 연관 이미지는 최대 3개 노드 이상을 넘지 않습니다.
                        // 다만 순서는 첫번째로 연결 노드 개수 낮은것들 우선, 그 중에서는 weight 점수 높은 녀석들 우선,
                        // 그 다음부터는 edge weight 합으로 정렬합니다.
                        Meteor.neo4j.call('searchImagesForTag', {tagWord: result[i], edgeScope: 3, NodesLimit: howManyEach}, function (err, data) {
                            // callCnt++;
                            Images = data.i;
                            if (Images.length == 0) return; //no image

                            if (result.indexOf(data.t[0].word) == -1) {
                                // 만약 현재 구해야하는 result가 아닌 결과를 받아왔으면 과감하게 빠이를 외치자.
                                // 넌 늦었어.
                                return;
                            } else {
                                // 이들은 모두 현재 구해야하는 result들이다.
                                console.log(Images.length+'개의 결과를 가져왔습니다.')
                                pushImages(Images, result.length /*나중에 Image 점수로 바꿔야해*/ , data.t, 2);

                                restoreCenterImage(2);
                                // 다시 바꿔주자.
                                // ImageQueue.heap[CenterImageNum] = CenterImageNode;

                                Session.set("images", ImageQueue.heap);
                                Tracker.flush();
                                Tracker.afterFlush(function(){
                                      setImagePosition(slider_options);
                                })
                            }
                        })
                    }
                }
            });
        }
    }, 300),

    // "click [name=moveToEditor]": function () {
    //     Router.go('editor', {}, {
    //         query: {
    //             _url: Session.get('mainImage')
    //         }
    //     });
    // },
    "click [data-image-item]": function (e, tmpl) {
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
    images: function () {
        var tempObject = Session.get("images");
        for(var i=0;i<tempObject.length;i++){
          tempObject[i].index = i;
        }

        return tempObject;
    }// },
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
    var firstSketch = {
        createdAt: new Date,
        updatedAt: new Date,
        createdBy: Meteor.userId() || "Anonymous",
        content: [
            {
                type: "image",
                url: "http://static.pexels.com/wp-content/uploads/2014/06/fallen-trees-forest-stack-1045-821x550.jpg"
            },
            {
                type: "textbox",
                innerText: ""
            }
        ]
    }

    TempWorkpieces.insert(firstSketch, function (err, result) {
        if (!err) {
            // 저장 후 나온 아이디값을 currentIndex session에 저장합니다.
            Session.set("currentId", result);
        } else {
            console.log('sketch insert error: ', err);
        }
    });
};

Template.Home.rendered = function () {
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
    function imageApp() {
    }

    imageApp.prototype = {
        targetImage: $('#main-image'),
        mainText: $('[data-main-text]'),

        textConfig: {
            isFirstInput: true,
            fontsize: 40,
            fontype: 'Hanna',
            fontfamily: 'Hanna'
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
            }
        },

        slideOption: {
            brightnessOpt: 'value: 100, min: 0, max: 200, step: 1',
            contrastOpt: 'value: 100, min: 0, max: 200, step: 1',
            blurOpt: 'value: 0, min: 0, max: 10, step: 1'
        },

        init: function () {
            this.initTextDivPosition();
            this.setBottomFilter();
            this.addEventListener();
            this.setImageSliderEventListener();
        },

        initTextDivPosition: function () {
            var textDivXPosition = (640 - $('[data-main-text]').height()) / 2;
            $('[data-main-text]').css('top', textDivXPosition);
        },

        setBottomFilter: function () {
            $('[data-main-text]').focus();
            $('[data-bottom-type]').hide();
            $('[data-bottom-type="fontFilter"]').show();
        },

        addEventListener: function () {
            this.toggleBottomFilter();
            this.catchTextBoxEnterKeyEvent();
            this.setImageFilterType();
            this.setEditorStyle();
            this.setTextDivPosition();

            this.setRenderImage();
        },

        toggleBottomFilter: function () {
            $('body').on('click', '.main-text', function (e) {
                e.stopPropagation();
                $('[data-bottom-type]').hide();
                $('[data-bottom-type="fontFilter"]').show();
            })

            $('body').on('click', '#main-image', function () {
                $('[data-bottom-type]').hide();
                $('[data-bottom-type="imageFilter"]').show();
            })
        },

        catchTextBoxEnterKeyEvent: function () {
            $('[data-main-text][contenteditable=true]').keydown(function (e) {
                // trap the return key being pressed
                var height = $('[data-main-text]').height();
                if (height > 620) {
                    if (e.keyCode != 8) {
                        return false;
                    }
                }

//                if (e.keyCode == 13) {
//                    var height = $('[data-main-text]').height();
//                    if(height < 600) {
//                        // insert 2 br tags (if only one br tag is inserted the cursor won't go to the second line)
//                        document.execCommand('insertHTML', false, '<br><br>');
//                        // prevent the default behaviour of return key pressed
//                        return false;
//                    } else {
//                        return false;
//                    }
//                }
            });
        },

        setEditorStyle: function () {
            $('[data-main-text-typography]').change(function () {
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

            $('[data-change-font-size-filter]').on('change', function () {
                var fontsize;
                fontsize = $(this).val() - 0;

                console.log(fontsize);
                $('[data-main-text]').css('font-size', fontsize);
                imageApp.textConfig.fontsize = fontsize;
            });

            $('[data-change-font-types]').on('change', function () {
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

            $('[data-change-font-justify]').on('click', function () {
                var selectedValue = $(this).val();
                $('[data-main-text]').css('text-align', selectedValue);
            });


        },

        setTextDivPosition: function () {
            $('[data-main-text]').keyup(function (e) {
                $('[data-main-text]').trigger('heightChange');
            });

            $('[data-main-text]').on('heightChange', function (e) {
                var textHeight = $('[data-main-text]').height();
                if (textHeight < 640) {
                    var textDivXPosition = (640 - textHeight) / 2;
                    $('[data-main-text]').css('top', textDivXPosition);
                }
            })
        },

        setRenderImage: function () {
            $('[data-rasterizes]').on('click', function () {
                imageApp.setCssInlineStylePropsForTextEditorDiv();
                imageApp.actionRasterizeHTML();

            });
        },

        setCssInlineStylePropsForTextEditorDiv: function () {
            var styleProps = $('.main-text').css([
                "width", "height", "position", "top", "left", "color", "background-color", "font-size", "font-family", "text-align", "font-weight", "font-style", "line-height", "margin", "padding"
            ]);

            $.each(styleProps, function (prop, value) {
                $('.main-text').css(prop, value);
            });
        },

        actionRasterizeHTML: function () {
            console.log('font type : ' + imageApp.textConfig.fontype + ", font family: " + imageApp.textConfig.fontfamily)

            var mainText = $('.main-text')[0].outerHTML;

            var parent = $('#main-image').parent();
            var parentClone = parent.clone();

            parentClone.css('width', '640px');
            parentClone.css('height', '640px');

            var parentResult = parentClone[0].outerHTML;

            var mainClone = $('#main-image').clone();
            mainClone.css('left', '100px');
            mainClone.css('width', '640px');
            mainClone.css('height', '640px');

            var mainCloneOuterHTML = mainClone[0].outerHTML;

            var innerHtml = "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><style> @font-face{font-family: "
                + imageApp.textConfig.fontfamily
                + "; src: url(/font/"
                + imageApp.textConfig.fontype
                + ".woff);} body {padding: 0; margin: 0; overflow:hidden;} img { vertical-align: top; }</style></head><body>"
                + parentResult + mainText + '</body></html>';


            rasterizeHTML.drawHTML(innerHtml).then(function success(renderResult) {
                var url = getBase64Image(renderResult.image);

                function _ImageFiles(url, callback) {
                    // client단에서 이미지를 넣어줍니다.
                    // server단에서 이미지를 넣어주려면 base64 encoded data uri가 websocket을 통해 서버까지 올라가야하므로
                    // 또 다른 작업 공수를 야기시킵니다. 라이브러리에서도 client단에서 이미지를 넣어주기를
                    // 권장하고 있습니다.
                    ImageFiles.insert(url, function (err, fileObj) {
                        // 비동기 문제를 해결하기 위해 아래의 연산을 수행합니다.
                        // 이는 .on("stored", callback) 이벤트 핸들러가 아직 client단에는 마련되지 않았다고
                        // 공식적으로 저자가 밝히고 있는 비동기 문제를 해결하기 위함입니다.
                        // (즉, 언제 실제로 파일이 저장되었는지를 이벤트로 보내주지 않음.)
                        // 에러 체크
                        if (!err) {
                            // setInterval을 find에 넣어줍니다.
                            var find = setInterval(function () {
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

                // _ImageFiles를 callback과 함께 실행시켜줍니다.
                _ImageFiles(url, function (url) {
                    // 시범용 이미지를 보여줍니다. (추후 삭제 예정)
                    $('[data-rendered-image]').attr('src', url);

                    // Workpieces collection에 정보를 넣어줍니다.
                    // (향후 local storage에 넣어진 object를 불러와 넣어주는 것으로 대체)

                    var workpiece = {
                        imageUrl: url
                    }

                    Workpieces.insert(workpiece, function (err, result) {
                        if (!err) {
                            // insert 시 반환되는 것은 inserted된 document의 _id값입니다.
                            var _id = result;
                            // Router.go('workpiece', {
                            //     _id: _id
                            // });
                        } else {
                            console.log('workpiece insert error: ', err);
                        }
                    });
                });
            }, function error(err) {
                console.log('rasterization failed: ', err);
            });
        },

        setImageFilterType: function () {

            var self = this;

            $('body').on('click','[data-preset]', function () {
                var selectedFilterType = $(this).attr('data-preset');
                self.imageFilterConfig.type = selectedFilterType;

                if (selectedFilterType == 'default') {
                    self.initSliderSetting();
                    self.initImageFilterConfig();
                }

                self.setImageFilter();
            });
        },

        setImageFilter: function () {
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

        setImageSliderEventListener: function () {
            this.initSliderSetting();
        },

        initSliderSetting: function () {

            var self = this;

            $('[data-event-slide-filter]').on('change', 'input', function () {
                var filter, value;
                filter = $(this).data('filter');
                value = $(this).val() - 0;
                self.imageFilterConfig[filter] = value;
                self.setImageFilter();
            });
        },

        initImageFilterConfig: function () {
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

    $('#tagBox').on('click', '[data-tag]', function (e) {
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
    Meteor.neo4j.call('setDefaultImages', {
        NumImages: MaximumImageNum // 최초 뿌려줄 이미지 개수입니다.
    },
    function (err, data) {
        if (err) throw err;

        if (!!data) {
            AllImages = data.i;

            console.dir('Random한 이미지로 가져왔습니다.');
            console.dir(AllImages);

            pushImages(AllImages, 0, data.t, 0);

            // 가운데 이미지 번호를 가지고 있습니다.
            CenterImageNum = parseInt(MaximumImageNum/2);
            CenterImageNode = ImageQueue.heap[CenterImageNum];
            console.dir(ImageQueue.heap[CenterImageNum]);

            Session.set("images", ImageQueue.heap);
            Tracker.flush();
            Tracker.afterFlush(function(){
                  setJeegleSlider();
            })
        }
    });
};

function setJeegleSlider() {
    // slider_box
    //  slider
    //    slider ul
    //       slider ul li
    $('.slider_box').css('display','block');

    // I said it's odd.
    if (slider_options.$DisplayPieces % 2 == 0) {
        slider_options.$DisplayPieces = slider_options.$DisplayPieces + 1;
    }

    //(ex) 21개면 centerElem은 11
    centerElem = parseInt(MaximumImageNum / 2) + 1;
    console.log('center:' + centerElem);

    // slider의 너비와 높이를 받아옵니다.
    windowWidth = $('#slider_box').width();
    windowHeight = slider_options.$CenterLen;

    // 작은 이미지들 너비 설정
    smallElemsWholeWidth = windowWidth - slider_options.$CenterLen;                      // 작은 이미지의 전체 길이
    smallElemsDivLen = parseInt(smallElemsWholeWidth / (slider_options.$DisplayPieces - 1)); // 작은 이미지의 각자 길이 width=height
    slider_options.$smallElemsDivLen = smallElemsDivLen;

    $('.image-div').css('width', smallElemsDivLen);
    $('.image-div').css('height', smallElemsDivLen);

    $('#slider').css('top', (slider_options.$CenterLen-smallElemsDivLen)/2)

    // slider ul 또한 동일한 height를 주게 됩니다.
    $('#slider').css('height', smallElemsDivLen);

    // 중앙 엘리먼트 크기 설정
    var centralElement = $('#slider li:nth-child(' + centerElem + ')');
    centralElement.css('width', slider_options.$CenterLen);
    centralElement.css('height', slider_options.$CenterLen);
    centralElement.css('bottom', (slider_options.$CenterLen - smallElemsDivLen) / 2);
    centralElement[0].children[0].id = 'main-image';

    // 배경이미지 설정
    backgroundStyle = "url('"+centralElement[0].children[0].src+"')";
    $('.bg_body').css('background-image',backgroundStyle);

    // 가운데 정렬!
    var slideULWidth = smallElemsDivLen * (MaximumImageNum - 1) + slider_options.$CenterLen;
    var leftPosition = -(slideULWidth - windowWidth) / 2
     $('#slider').css('left', leftPosition);

    // 버튼 위치 설정
    $('a.control_prev').css('top', (slider_options.$CenterLen - slider_options.$ArrowHeight) / 2 + "px");
    $('a.control_next').css('top', (slider_options.$CenterLen - slider_options.$ArrowHeight) / 2 + "px");

    setImagePosition(slider_options);

    function moveLeft(cen) {
        var bigToSmall = cen;
        var smallToBig = cen - 1;

        $('#slider').animate({
            left: leftPosition+smallElemsDivLen
        }, 200, function () {
            $('#slider li:last-child').prependTo('#slider');
            $('#slider').css('left', leftPosition);
        });

        var bigToSmallLi = $('#slider li:nth-child(' + (bigToSmall) + ')')
        bigToSmallLi.animate({
            width: smallElemsDivLen,
            height: smallElemsDivLen,
            bottom: 0
        }, 200, function () {
        })

        var bigToSmallImg = $('#slider li:nth-child(' + (bigToSmall) + ') img');
        bigToSmallImg.attr('id', '');
        if (bigToSmallImg.width() > bigToSmallImg.height()) {
            var smallWidth = bigToSmallImg.width() * (smallElemsDivLen / slider_options.$CenterLen)
            $('#slider li:nth-child(' + (bigToSmall) + ') img').animate({
                left: -(smallWidth - smallElemsDivLen) / 2 + "px"
            }, 200, function () {
            })
        } else {
            var smallHeight = bigToSmallImg.height() * (smallElemsDivLen / slider_options.$CenterLen)
            $('#slider li:nth-child(' + (bigToSmall) + ') img').animate({
                top: -(smallHeight - smallElemsDivLen) / 2 + "px"
            }, 200, function () {
            })
        }

        var smallToBigLi = $('#slider li:nth-child(' + (smallToBig) + ')')
        smallToBigLi.animate({
            width: '640px',
            height: '640px',
            bottom: (slider_options.$CenterLen - smallElemsDivLen) / 2
        }, 200, function () {
        });

        var smallToBigImg = $('#slider li:nth-child(' + (smallToBig) + ') img');
        smallToBigImg.attr('id', 'main-image');
        if (smallToBigImg.width() > smallToBigImg.height()) {
            var bigWidth = smallToBigImg.width() * (slider_options.$CenterLen / smallElemsDivLen)
            $('#slider li:nth-child(' + (smallToBig) + ') img').animate({
                left: -(bigWidth - slider_options.$CenterLen) / 2 + "px"
            }, 200, function () {
            })
        } else {
            var bigHeight = smallToBigImg.height() * (slider_options.$CenterLen / smallElemsDivLen)
            $('#slider li:nth-child(' + (smallToBig) + ') img').animate({
                top: -(bigHeight - slider_options.$CenterLen) / 2 + "px"
            }, 200, function () {
            })
        }

        // 가운데 이미지 번호를 가지고 있습니다.
        CenterImageNum = smallToBigLi.attr('data-num'); //this image number
        CenterImageNode = ImageQueue.heap[CenterImageNum];
        console.log(CenterImageNum);

        // 배경이미지 설정
        backgroundStyle = "url('"+smallToBigImg[0].src+"')";
        $('.bg_body').css('background-image',backgroundStyle);

        // 현재 이미지가 width가 큰녀석이면
        // left를 맞춰준다.
        // 작아지는 이미지는 작았을때의 image width을 알아야하고
        // 커질때 이미지는 커질때 image width를 알아야한다.
        //
        // height가 큰녀석이면
        // top을 맞춰준다.
        // 작아지는 이미지는 작았을때의 image height을 알아야하고
        // 커질때 이미지는 커질때 image height를 알아야한다.
    };

    function moveRight(cen) {
        var bigToSmall = cen;
        var smallToBig = cen + 1;

        $('#slider').animate({
            left: leftPosition-smallElemsDivLen
        }, 200, function () {
            $('#slider li:first-child').appendTo('#slider');
            $('#slider').css('left', leftPosition);
        });

        var bigToSmallLi = $('#slider li:nth-child(' + (bigToSmall) + ')');
        bigToSmallLi.animate({
            width: smallElemsDivLen,
            height: smallElemsDivLen,
            bottom: 0
        }, 200, function () {
        })

        var bigToSmallImg = $('#slider li:nth-child(' + (bigToSmall) + ') img');
        bigToSmallImg.attr('id', '');
        if (bigToSmallImg.width() > bigToSmallImg.height()) {
            var smallWidth = bigToSmallImg.width() * (smallElemsDivLen / slider_options.$CenterLen)
            $('#slider li:nth-child(' + (bigToSmall) + ') img').animate({
                left: -(smallWidth - smallElemsDivLen) / 2 + "px"
            }, 200, function () {
            })
        } else {
            var smallHeight = bigToSmallImg.height() * (smallElemsDivLen / slider_options.$CenterLen)
            $('#slider li:nth-child(' + (bigToSmall) + ') img').animate({
                top: -(smallHeight - smallElemsDivLen) / 2 + "px"
            }, 200, function () {
            })
        }

        var smallToBigLi = $('#slider li:nth-child(' + (smallToBig) + ')');
        smallToBigLi.animate({
            width: '640px',
            height: '640px',
            bottom: (slider_options.$CenterLen - smallElemsDivLen) / 2
        }, 200, function () {
        })
        // 가운데 이미지 번호를 가지고 있습니다.
        CenterImageNum = smallToBigLi.attr('data-num'); //this image number
        CenterImageNode = ImageQueue.heap[CenterImageNum];
        console.log('center: '+CenterImageNum);

        var smallToBigImg = $('#slider li:nth-child(' + (smallToBig) + ') img');
        smallToBigImg.attr('id', 'main-image');
        if (smallToBigImg.width() > smallToBigImg.height()) {
            var bigWidth = smallToBigImg.width() * (slider_options.$CenterLen / smallElemsDivLen)
            $('#slider li:nth-child(' + (smallToBig) + ') img').animate({
                left: -(bigWidth - slider_options.$CenterLen) / 2 + "px"
            }, 200, function (e) {
            })
        } else {
            var bigHeight = smallToBigImg.height() * (slider_options.$CenterLen / smallElemsDivLen)
            $('#slider li:nth-child(' + (smallToBig) + ') img').animate({
                top: -(bigHeight - slider_options.$CenterLen) / 2 + "px"
            }, 200, function (e) {
            })
        }


        // 배경이미지 설정
        backgroundStyle = "url('"+smallToBigImg[0].src+"')";
        $('.bg_body').css('background-image',backgroundStyle);
    };

    $('a.control_prev').click(_.debounce(function (e) {
        e.preventDefault();
        moveLeft(centerElem);
    }, 220));

    $('a.control_next').click(_.debounce(function (e) {
        e.preventDefault();
        moveRight(centerElem);
    }, 220));
};

function setImagePosition(slider_options){
  var slider_images = document.getElementsByName('images_in_belt');

  _.forEach(slider_images, function (img) {
      if(img.complete){
        onLoadImage(img);
      }else{
        img.onload = onLoadImage;
      }
  })

  function onLoadImage (img){
    if(this!=window){
      //onload 이벤트 실행시
      img = this;
    }

    imgWidth = img.width;
    imgHeight = img.height;

    if (imgWidth > imgHeight) {
        // 가로가 더 긴 경우
        img.style.height = "100%";
        img.style.top = 0;
        if (img.id == 'main-image') {
            img.style.left = -(img.width - slider_options.$CenterLen) / 2 + "px";
        } else {
            img.style.left = -(img.width - slider_options.$smallElemsDivLen) / 2 + "px";
        }
    } else {
        // 세로가 더 긴 경우
        img.style.width = "100%";
        img.style.left = 0;
        if (img.id == 'main-image') {
            img.style.top = -(img.height - slider_options.$CenterLen) / 2 + "px";
        } else {
            img.style.top = -(img.height - slider_options.$smallElemsDivLen) / 2 + "px";
        }
    }
  }
}

Template.Home.destroyed = function () {
};

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
    html += '<li><a href="#" id="tagNum-' + tagNum + '" class="tag-filter-item" data-tag=' + tagWord + '>';
    html += tagWord;
    html += '</a></li>';

    $('#tagBox').append(html);
}


function pushImages(Images, priority, tag, type) {
    var ImageArray = new Array();

    for (k = 0; k < Images.length; k++) {
        var duplicatedFlag = false;
        for (j = 0; j < ImageQueue.heap.length; j++) {
            if (ImageQueue.heap[j].data.thumbnailImageUrl == Images[k].thumbnailImageUrl) {
                duplicatedFlag = true;
                console.log('duplicated!')
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
    this.decTagCount = function () {
        cnt--;
    }
    this.incTagCount = function () {
        cnt++;
    }
    this.getTagCount = function () {
        return cnt;
    }
}


function restoreCenterImage(ImageNode, type){
  if(type==0){
    ImageQueue.proportion.random--;
  }else if(type==1){
    ImageQueue.proportion.tag--;
  }else{
    ImageQueue.proportion.sentence--;
  }

  if(CenterImageNode.type==0){
    ImageQueue.proportion.random++;
  }else if(CenterImageNode.type==1){
    ImageQueue.proportion.tag++;
  }else{
    ImageQueue.proportion.sentence++;
  }

  ImageQueue.heap[CenterImageNum] = ImageNode;
}
