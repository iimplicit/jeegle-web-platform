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
    },
    "click [data-rasterize]": function(e, tmpl){
        var $canvasWrapper = $('.main-content-wrapper');
        var innerHtml = $canvasWrapper.html();

        innerHtml = "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><style>body {background-image: url(test.jpg)}</style></head><body>"
            + innerHtml + '</body></html>';

        rasterizeHTML.drawHTML(innerHtml).then(function success(renderResult) {
            console.dir(renderResult);
            console.dir(renderResult.svg);
            var url = getBase64Image(renderResult.image);

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

            // _ImageFiles를 callback과 함께 실행시켜줍니다.
            _ImageFiles(url, function(url) {
                // 시범용 이미지를 보여줍니다. (추후 삭제 예정)
                $('[data-rendered-image]').attr('src', url);
            });
        }, function error(err) {
            console.log('rasterization failed: ', err);
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

        init: function() {
            this.setBottomFilter();
            this.addEventListener();
            this.setImageSliderEventListener();
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
            this.setRenderImage();
        },

        toggleBottomFilter: function() {
            $('body').on('click', '.main-text', function(e) {
                e.stopPropagation();
                $('[data-bottom-type]').hide();
                $('[data-bottom-type="fontFilter"]').show();
            })

            $('body').on('click', '[data-content]', function() {
                $('[data-bottom-type]').hide();
                $('[data-bottom-type="imageFilter"]').show();
            })
        },

        catchTextBoxEnterKeyEvent: function() {
            $('[data-main-text][contenteditable=true]').keydown(function(e) {
                // trap the return key being pressed
                if (e.keyCode == 13) {
                    var height = $('[data-main-text]').height();
                    console.log(height)
                    if(height < 600) {
                        // insert 2 br tags (if only one br tag is inserted the cursor won't go to the second line)
                        document.execCommand('insertHTML', false, '<br><br>');
                        // prevent the default behaviour of return key pressed
                        return false;
                    } else {
                        return false;
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

                console.log(fontsize);
                $('[data-main-text]').css('font-size', fontsize);
                imageApp.textConfig.fontsize = fontsize;
            });

            $('[data-change-font-types]').on('change', function() {
                var isCheckBold = $("input:checkbox[data-change-font-type='bold']").is(":checked");
                var isCheckItalic = $("input:checkbox[data-change-font-type='italic']").is(":checked");
                var isCheckShadow = $("input:checkbox[data-change-font-type='shadow']").is(":checked");

                $('[data-main-text]').css('font-weight', '');
                $('[data-main-text]').css('font-style', '');
                $('[data-main-text]').css('text-shadow', '');

                if(isCheckBold) {
                    $('[data-main-text]').css('font-weight', 'bold');
                }

                if(isCheckItalic) {
                    $('[data-main-text]').css('font-style', 'italic');
                }

                if(isCheckShadow) {
                    $('[data-main-text]').css('text-shadow', '3px 3px #000');
                }
            });

            $('[data-change-font-justify]').on('click', function() {
                var selectedValue = $(this).val();
                $('[data-main-text]').css('text-align', selectedValue);
            });


        },

        setRenderImage: function() {
            $('[data-render-image]').on('click', function(){
                imageApp.setCssInlineStylePropsForTextEditorDiv();
                imageApp.actionRasterizeHTML();

            });
        },

        setCssInlineStylePropsForTextEditorDiv: function() {
            var styleProps = $('#drag-me').css([
                "width", "height", "position", "top", "left", "color", "background-color", "font-size", "font-family"
            ]);

            $.each(styleProps, function(prop, value) {
                $('#drag-me').css(prop, value);
            });
        },

        actionRasterizeHTML: function() {
            console.log('font type : ' + imageApp.textConfig.fontype + ", font family: " + imageApp.textConfig.fontfamily)

            var $canvasWrapper = $('[data-canvas-wrapper]');
            var innerHtml = $canvasWrapper.html();

            innerHtml = "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><style> @font-face{font-family: "
                + imageApp.textConfig.fontfamily
                + "; src: url(/font/"
                + imageApp.textConfig.fontype
                + ".woff);} body {padding: 0; margin: 0; overflow:hidden;} img { vertical-align: top; }</style></head><body>"
                + innerHtml + '</body></html>';
            var element = document.getElementById('canvas');

            // htmlToCanvas(innerHtml);

            rasterizeHTML.drawHTML(innerHtml).then(function success(renderResult) {
                console.dir(renderResult);
                console.dir(renderResult.svg);
                var url = getBase64Image(renderResult.image);

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

                // _ImageFiles를 callback과 함께 실행시켜줍니다.
                _ImageFiles(url, function(url) {
                    // 시범용 이미지를 보여줍니다. (추후 삭제 예정)
                    $('[data-rendered-image]').attr('src', url);

                    // Workpieces collection에 정보를 넣어줍니다.
                    // (향후 local storage에 넣어진 object를 불러와 넣어주는 것으로 대체)

                    var workpiece = {
                        imageUrl: url
                    }

                    Workpieces.insert(workpiece, function(err, result) {
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

        setImageFilterType: function() {

            var self = this;

            $('[data-preset]').on('click', function() {
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

            this.targetImage.css("filter",
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

            this.targetImage.css("-webkit-filter",
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
        }
    }

    /*****************************************************************************/
    /* application init method
     /*****************************************************************************/
    var imageApp = new imageApp();
    imageApp.init();



    /*****************************************************************************/
    /* sunpil
     /*****************************************************************************/
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

};

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