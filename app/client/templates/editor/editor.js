///*****************************************************************************/
///* Editor: Event Handlers */
///*****************************************************************************/
//Template.Editor.events({
//
//});
//
///*****************************************************************************/
///* Editor: Helpers */
///*****************************************************************************/
//Template.Editor.helpers({});
//
///*****************************************************************************/
///* Editor: Lifecycle Hooks */
///*****************************************************************************/
//Template.Editor.created = function() {};
//
//Template.Editor.rendered = function() {
//    //  참고.. image effect range
//    //            grayscale : 100 + '%', // 0~ 100
//    //            blur: 0 + 'px', // 10
//    //            brightness: 100 + '%', // 200
//    //            contrast: 100 + '%', // 200
//    //            hue_rotate: 0 + 'deg', // 360
//    //            opacity: 100 + '%', // 0 ~ 100
//    //            invert: 0 + '%', // 0 ~ 100
//    //            saturate: 100 + '%', // 0 ~ 500
//    //            sepia: 0 + '%' // 0 ~ 100
//
//    /*****************************************************************************/
//    /* Image 관련 기능*/
//    /*****************************************************************************/
//    function imageApp() {}
//
//    imageApp.prototype = {
//        targetImage: $('#main-target'),
//
//        textConfig: {
//            fontsize: 22,
//            fontype: 'Hanna',
//            fontfamily: 'Hanna'
//        },
//
//        imageFilterConfig: {
//            type: 'default',
//            grayscale: 0, // 100
//            blur: 0, // 10
//            brightness: 100, // 200
//            contrast: 100, // 200
//            hue_rotate: 0, // 360
//            opacity: 100, // 0 ~ 100
//            invert: 0, // 0 ~ 100
//            saturate: 100, // 0 ~ 500
//            sepia: 0 // 0 ~ 100
//        },
//
//        imageFilterType: {
//            default: {
//                grayscale: 0, // 100
//                blur: 0, // 10
//                brightness: 0, // 200
//                contrast: 0, // 200
//                hue_rotate: 0, // 360
//                opacity: 0, // 0 ~ 100
//                invert: 0, // 0 ~ 100
//                saturate: 0, // 0 ~ 500
//                sepia: 0 // 0 ~ 100
//            },
//
//            vintage: {
//                grayscale: 0, // 100
//                blur: 0, // 10
//                brightness: 0, // 200
//                contrast: 0, // 200
//                hue_rotate: 0, // 360
//                opacity: 0, // 0 ~ 100
//                invert: 0, // 0 ~ 100
//                saturate: 0, // 0 ~ 500
//                sepia: 100 // 0 ~ 100
//            },
//
//            clarity: {
//                grayscale: 100, // 100
//                blur: 0, // 10
//                brightness: 0, // 200
//                contrast: 0, // 200
//                hue_rotate: 0, // 360
//                opacity: 0, // 0 ~ 100
//                invert: 0, // 0 ~ 100
//                saturate: 0, // 0 ~ 500
//                sepia: 0 // 0 ~ 100
//            }
//        },
//
//        slideOption: {
//            brightnessOpt: 'value: 100, min: 0, max: 200, step: 1',
//            contrastOpt: 'value: 100, min: 0, max: 200, step: 1',
//            blurOpt: 'value: 0, min: 0, max: 10, step: 1'
//        },
//
//        init: function() {
//            this.addEventListener();
//            this.setImageSliderEventListener();
//        },
//
//        addEventListener: function() {
//            this.setImageFilterType();
//            this.setTypography();
//            this.setEditorStyle();
//            this.setRenderImage();
//        },
//
//        setRenderImage: function() {
//            $('[data-render-image]').on('click', function(){
//                imageApp.setCssInlineStylePropsForTextEditorDiv();
//                imageApp.actionRasterizeHTML();
//
//            });
//        },
//
//        setCssInlineStylePropsForTextEditorDiv: function() {
//            var styleProps = $('#drag-me').css([
//                "width", "height", "position", "top", "left", "color", "background-color", "font-size", "font-family"
//            ]);
//
//            $.each(styleProps, function(prop, value) {
//                $('#drag-me').css(prop, value);
//            });
//        },
//
//        actionRasterizeHTML: function() {
//            console.log('font type : ' + imageApp.textConfig.fontype + ", font family: " + imageApp.textConfig.fontfamily)
//
//            var $canvasWrapper = $('[data-canvas-wrapper]');
//            var innerHtml = $canvasWrapper.html();
//
//            innerHtml = "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><style> @font-face{font-family: "
//                + imageApp.textConfig.fontfamily
//                + "; src: url(/font/"
//                + imageApp.textConfig.fontype
//                + ".woff);} body {padding: 0; margin: 0; overflow:hidden;} img { vertical-align: top; }</style></head><body>"
//                + innerHtml + '</body></html>';
//            var element = document.getElementById('canvas');
//
//            // htmlToCanvas(innerHtml);
//
//            rasterizeHTML.drawHTML(innerHtml).then(function success(renderResult) {
//                console.dir(renderResult);
//                console.dir(renderResult.svg);
//                var url = getBase64Image(renderResult.image);
//
//                function _ImageFiles(url, callback) {
//                    // client단에서 이미지를 넣어줍니다.
//                    // server단에서 이미지를 넣어주려면 base64 encoded data uri가 websocket을 통해 서버까지 올라가야하므로
//                    // 또 다른 작업 공수를 야기시킵니다. 라이브러리에서도 client단에서 이미지를 넣어주기를
//                    // 권장하고 있습니다.
//                    ImageFiles.insert(url, function(err, fileObj) {
//                        // 비동기 문제를 해결하기 위해 아래의 연산을 수행합니다.
//                        // 이는 .on("stored", callback) 이벤트 핸들러가 아직 client단에는 마련되지 않았다고
//                        // 공식적으로 저자가 밝히고 있는 비동기 문제를 해결하기 위함입니다.
//                        // (즉, 언제 실제로 파일이 저장되었는지를 이벤트로 보내주지 않음.)
//                        // 에러 체크
//                        if (!err) {
//                            // setInterval을 find에 넣어줍니다.
//                            var find = setInterval(function() {
//                                var url = fileObj.url();
//                                if (!!url) {
//                                    // 만약 url이 null이 아닐 경우(비동기 문제가 해결 됬을 경우)
//                                    // setInterval을 멈춰줍니다.
//                                    clearInterval(find);
//                                    // 처음에 _ImageFiles에서 받았던 callback을 불러줍니다.
//                                    return callback(url);
//                                }
//                            }, 100);
//                        } else {
//                            console.log('file insert error: ', err);
//                        }
//                    });
//                }
//
//                // _ImageFiles를 callback과 함께 실행시켜줍니다.
//                _ImageFiles(url, function(url) {
//                    // 시범용 이미지를 보여줍니다. (추후 삭제 예정)
//                    $('[data-rendered-image]').attr('src', url);
//
//                    // Workpieces collection에 정보를 넣어줍니다.
//                    // (향후 local storage에 넣어진 object를 불러와 넣어주는 것으로 대체)
//
//                    var workpiece = {
//                        imageUrl: url
//                    }
//
//                    Workpieces.insert(workpiece, function(err, result) {
//                        if (!err) {
//                            // insert 시 반환되는 것은 inserted된 document의 _id값입니다.
//                            var _id = result;
//                            // Router.go('workpiece', {
//                            //     _id: _id
//                            // });
//                        } else {
//                            console.log('workpiece insert error: ', err);
//                        }
//                    });
//                });
//            }, function error(err) {
//                console.log('rasterization failed: ', err);
//            });
//        },
//
//        setEditorStyle: function() {
//            $('[data-event-change-div-style]').on('click', function() {
//                $('#drag-me').toggleClass('black-bg no-bg');
//
//                if($('#drag-me').hasClass('black-bg')) {
//                    $('#drag-me').css('background-color', '#000000');
//                } else {
//                    $('#drag-me').css('background-color', '');
//                }
//            });
//        },
//
//        setTypography: function() {
//            $('[data-event-change-typography]').on('click', function() {
//                var selectedFontType = $(this).attr('data-event-change-typography');
//                var selectedFontFamily = $(this).attr('data-font-family');
//
//                var prevClassName = $('#drag-me').attr('class');
//                var prevClassArray = prevClassName.split(' ');
//                for (var i = 0; i < prevClassArray.length; i++) {
//                    if (prevClassArray[i] != 'black-bg' && prevClassArray[i] != 'no-bg' && prevClassArray[i] != 'draggable') {
//                        $('#drag-me').removeClass(prevClassArray[i]);
//                    }
//                }
//
//                $('#drag-me').addClass(selectedFontType);
//                $('#drag-me').css('font-family', selectedFontFamily);
//
//                imageApp.textConfig.fontype = selectedFontType;
//                imageApp.textConfig.fontfamily = selectedFontFamily;
//            });
//        },
//
//        setImageFilterType: function() {
//
//            var self = this;
//
//            $('[data-preset]').on('click', function() {
//                var selectedFilterType = $(this).attr('data-preset');
//                self.imageFilterConfig.type = selectedFilterType;
//
//                if (selectedFilterType == 'default') {
//                    self.initSliderSetting();
//                    self.initImageFilterConfig();
//                }
//
//                self.setImageFilter();
//            });
//        },
//
//        setImageFilter: function() {
//            var selectedFilterType = this.imageFilterConfig.type;
//
//            this.targetImage.css("filter",
//                'grayscale(' + (this.imageFilterConfig.grayscale + this.imageFilterType[selectedFilterType].grayscale) + '%)' +
//                'blur(' + (this.imageFilterConfig.blur + this.imageFilterType[selectedFilterType].blur) + 'px)' +
//                'brightness(' + (this.imageFilterConfig.brightness + this.imageFilterType[selectedFilterType].brightness) + '%)' +
//                'contrast(' + (this.imageFilterConfig.contrast + this.imageFilterType[selectedFilterType].contrast) + '%)' +
//                'hue-rotate(' + (this.imageFilterConfig.hue_rotate + this.imageFilterType[selectedFilterType].hue_rotate) + 'deg)' +
//                'opacity(' + (this.imageFilterConfig.opacity + this.imageFilterType[selectedFilterType].opacity) + '%)' +
//                'invert(' + (this.imageFilterConfig.invert + this.imageFilterType[selectedFilterType].invert) + '%)' +
//                'saturate(' + (this.imageFilterConfig.saturate + this.imageFilterType[selectedFilterType].saturate) + '%)' +
//                'sepia(' + (this.imageFilterConfig.sepia + this.imageFilterType[selectedFilterType].sepia) + '%)'
//            );
//
//            this.targetImage.css("-webkit-filter",
//                    'grayscale(' + (this.imageFilterConfig.grayscale + this.imageFilterType[selectedFilterType].grayscale) + '%)' +
//                    'blur(' + (this.imageFilterConfig.blur + this.imageFilterType[selectedFilterType].blur) + 'px)' +
//                    'brightness(' + (this.imageFilterConfig.brightness + this.imageFilterType[selectedFilterType].brightness) + '%)' +
//                    'contrast(' + (this.imageFilterConfig.contrast + this.imageFilterType[selectedFilterType].contrast) + '%)' +
//                    'hue-rotate(' + (this.imageFilterConfig.hue_rotate + this.imageFilterType[selectedFilterType].hue_rotate) + 'deg)' +
//                    'opacity(' + (this.imageFilterConfig.opacity + this.imageFilterType[selectedFilterType].opacity) + '%)' +
//                    'invert(' + (this.imageFilterConfig.invert + this.imageFilterType[selectedFilterType].invert) + '%)' +
//                    'saturate(' + (this.imageFilterConfig.saturate + this.imageFilterType[selectedFilterType].saturate) + '%)' +
//                    'sepia(' + (this.imageFilterConfig.sepia + this.imageFilterType[selectedFilterType].sepia) + '%)'
//            );
//        },
//
//        setImageSliderEventListener: function() {
//            this.initSliderSetting();
//        },
//
//        initSliderSetting: function() {
//
//            var self = this;
//
//            $('#Filters').on('change', '.FilterSetting input', function() {
//                var filter, value;
//                filter = $(this).data('filter');
//                value = $(this).val() - 0;
//                self.imageFilterConfig[filter] = value;
//                self.setImageFilter();
//            });
//        },
//
//        initImageFilterConfig: function() {
//            this.imageFilterConfig = {
//                type: 'default',
//                grayscale: 0, // 100
//                blur: 0, // 10
//                brightness: 100, // 200
//                contrast: 100, // 200
//                hue_rotate: 0, // 360
//                opacity: 100, // 0 ~ 100
//                invert: 0, // 0 ~ 100
//                saturate: 100, // 0 ~ 500
//                sepia: 0 // 0 ~ 100
//            },
//
//            $("input[data-filter=brightness]").val(100);
//            $("input[data-filter=contrast]").val(100);
//            $("input[data-filter=blur]").val(0);
//        }
//    }
//
//    /*****************************************************************************/
//    /* TextEditor 관련 기능*/
//    /*****************************************************************************/
//    editorApp = {
//        data: {},
//
//        init: function() {
//            this.addEventListener();
//        },
//
//        addEventListener: function() {
//            this.setInlineEdiorDbclick();
//        },
//
//        setInlineEdiorDbclick: function() {
//            var self = this;
//            $('.draggable').dblclick(function() {
//                // We need to turn off the automatic editor creation first.
//                var targetId = 'drag-me';
//                self.editorInit(targetId);
//                interact('.draggable').draggable({
//                    enabled: false
//                });
//            })
//        },
//
//        editorInit: function(targetId) {
//            CKEDITOR.disableAutoInline = true;
//
//            var activeEditor = 0;
//            var activeEditorElement = 0;
//            var activeId = '';
//
//            // Is there already an editor active?
//            if (activeEditor) {
//
//                // Is the active editor the same
//                // as the one being requested?
//                if (activeEditor.element.getId() == activeId) {
//                    // Then our editor is already running
//                    // so there's nothing to do!
//                    return;
//                }
//                activeEditor.destroy();
//            }
//
//            // Find the element that we want to
//            // attach the editor to
//            if (!(activeEditorElement = document.getElementById(targetId))) {
//                return;
//            }
//
//            // TODO - verify that the element is either a
//            // div or a textarea which are the only two
//            // element types supporting contenteditable=true
//
//            // Make the element editable
//            activeEditorElement.setAttribute('contenteditable', 'true');
//
//            // Create a new inline editor for this div
//            activeEditor = CKEDITOR.inline(targetId, {
//                skin: 'flat',
//                toolbar: [{
//                    name: 'basicstyles',
//                    groups: ['basicstyles'],
//                    items: ['Bold', 'Italic', 'Underline', 'Strike']
//                }, {
//                    name: 'paragraph',
//                    groups: ['align'],
//                    items: ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']
//                }, {
//                    name: 'styles',
//                    items: ['FontSize']
//                }, {
//                    name: 'colors',
//                    items: ['TextColor', 'BGColor']
//                }],
//
//                fontSize_defaultLabel: '22px',
//                fontSize_sizes: '8/8px;9/9px;10/10px;11/11px;12/12px;14/14px;16/16px;18/18px;20/20px;22/22px;24/24px;26/26px;28/28px;36/36px;48/48px;',
//                language: "ko",
//                resize_enabled: true
//            });
//
//            // Set up a destruction function that will occur
//            // when the user clicks out of the editable space
//            activeEditor.on('blur', function() {
//                this.element.setAttribute('contenteditable', 'false');
//                activeId = '';
//                activeEditor = 0;
//                activeEditorElement = 0;
//
//                interact('.draggable')
//                    .draggable({
//                        // enable inertial throwing
//                        inertia: true
//                        // keep the element within the area of it's parent
//                    });
//
//                var fontsize = $('.cke_combo__fontsize').text();
//
//                this.destroy();
//            });
//
//            // Now set the focus to our editor so
//            // that it will open up for business
//            activeEditorElement.focus();
//        }
//    }
//
//    /*****************************************************************************/
//    /* interact.js setting part
//    /*****************************************************************************/
//    // target elements with the "draggable" class
//    interact('.draggable')
//        .draggable({
//            // enable inertial throwing
//            inertia: true,
//            // keep the element within the area of it's parent
//            restrict: {
//                restriction: "parent",
//                endOnly: true,
//                elementRect: {
//                    top: 0,
//                    left: 0,
//                    bottom: 1,
//                    right: 1
//                }
//            },
//
//            // call this function on every dragmove event
//            onmove: function(event) {
//                var target = event.target,
//                // keep the dragged position in the data-x/data-y attributes
//                    x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
//                    y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
//
//                // translate the element
//                target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
//
//                // update the posiion attributes
//                target.setAttribute('data-x', x);
//                target.setAttribute('data-y', y);
//
//            },
//            // call this function on every dragend event
//            onend: function(event) {
//
//            }
//        });
//
//    var offset = {
//        x: 0,
//        y: 0
//    };
//
//    interact('.draggable')
//        .resizable({
//            edges: {
//                left: true,
//                right: true,
//                bottom: true,
//                top: true
//            }
//        })
//        .on('resizemove', function(event) {
//            var target = event.target;
//
//            // update the element's style
//            target.style.width = event.rect.width + 'px';
//            target.style.height = event.rect.height + 'px';
//
//            // translate when resizing from top or left edges
//            offset.x += event.deltaRect.left;
//            offset.y += event.deltaRect.top;
//
//            target.style.transform = ('translate(' + offset.x + 'px,' + offset.y + 'px)');
//
//            //            target.textContent = event.rect.width + '×' + event.rect.height;
//        });
//
//    /*****************************************************************************/
//    /* application init method
//    /*****************************************************************************/
//    var imageApp = new imageApp();
//    imageApp.init();
//    editorApp.init();
//
//};
//
//Template.Editor.destroyed = function() {};
//
//function getBase64Image(img) {
//    // Create an empty canvas element
//    var canvas = document.createElement("canvas");
//    canvas.width = img.width;
//    canvas.height = img.height;
//
//    // Copy the image contents to the canvas
//    var ctx = canvas.getContext("2d");
//    ctx.drawImage(img, 0, 0);
//
//    // Get the data-URL formatted image
//    // Firefox supports PNG and JPEG. You could check img.src to
//    // guess the original format, but be aware the using "image/jpg"
//    // will re-encode the image.
//    var dataURL = canvas.toDataURL("image/png");
//
//    return dataURL;
//    // return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
//}
//
//function htmlToCanvas(innerHtml) {
//    var canvas = document.getElementById('canvas');
//    var ctx = canvas.getContext('2d');
//
//    var data = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
//        '<foreignObject width="100%" height="100%" externalResourcesRequired="true">' +
//        innerHtml +
//        '</foreignObject>' +
//        '</svg>';
//
//    var DOMURL = window.URL || window.webkitURL || window;
//
//    var img = new Image();
//    var svg = new Blob([data], {
//        type: 'image/svg+xml;charset=utf-8'
//    });
//    var url = DOMURL.createObjectURL(svg);
//
//    img.onload = function() {
//        ctx.drawImage(img, 0, 0);
//        DOMURL.revokeObjectURL(url);
//    }
//
//    img.src = url;
//}