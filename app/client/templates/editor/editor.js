/*****************************************************************************/
/* Editor: Event Handlers */
/*****************************************************************************/
Template.Editor.events({
    "click [data-render-image]": function(e, tmpl) {
        var $canvasWrapper = $('[data-canvas-wrapper]');
        var innerHtml = $canvasWrapper.html();
        var element = document.getElementById('main-canvas');

        rasterizeHTML.drawHTML(innerHtml).then(function success(renderResult) {
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

                Workpieces.insert(workpiece, function(err, result){
                    if(!err) {
                        // insert 시 반환되는 것은 inserted된 document의 _id값입니다. 
                        var _id = result;
                        Router.go('workpiece', {
                            _id: _id
                        });
                    } else {
                        console.log('workpiece insert error: ', err);  
                    }
                });
            });
        }, function error(err) {
            console.log('rasterization failed: ', err);
        });;
    }
});

/*****************************************************************************/
/* Editor: Helpers */
/*****************************************************************************/
Template.Editor.helpers({
    mainImage: function() {
        return Session.get("savedImageData");
    },
    imageFiles: function() {
        return Session.get('imagesFiles');
    }
});

/*****************************************************************************/
/* Editor: Lifecycle Hooks */
/*****************************************************************************/
Template.Editor.created = function() {};

Template.Editor.rendered = function() {
    // 외부 url로 이미지를 가져오지 못하는 오류를 방지하기 위해 base64형태로 이미지를 바꿔서 넣어줍니다.
    convertImgToBase64(this.data.url);

    //  참고..
    //            grayscale : 100 + '%', // 0~ 100
    //            blur: 0 + 'px', // 10
    //            brightness: 100 + '%', // 200
    //            contrast: 100 + '%', // 200
    //            hue_rotate: 0 + 'deg', // 360
    //            opacity: 100 + '%', // 0 ~ 100
    //            invert: 0 + '%', // 0 ~ 100
    //            saturate: 100 + '%', // 0 ~ 500
    //            sepia: 0 + '%' // 0 ~ 100
    function imageApp() {}

    imageApp.prototype = {
        targetImage: $('#main-target'),

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
            this.addEventListener();
            this.setImageSliderEventListener();
        },

        addEventListener: function() {
            this.setImageFilterType();
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

            $('#Filters').on('change', '.FilterSetting input', function() {
                var filter, value;
                filter = $(this).data('filter');
                value = $(this).val() - 0;
                console.log(filter, value);
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

    var app = new imageApp();
    app.init();

    // target elements with the "draggable" class
    interact('.draggable')
        .draggable({
            // enable inertial throwing
            inertia: true,
            // keep the element within the area of it's parent
            restrict: {
                restriction: "parent",
                endOnly: true,
                elementRect: {
                    top: 0,
                    left: 0,
                    bottom: 1,
                    right: 1
                }
            },

            // call this function on every dragmove event
            onmove: function(event) {
                var target = event.target,
                    // keep the dragged position in the data-x/data-y attributes
                    x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
                    y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                // translate the element
                target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

                // update the posiion attributes
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
            },
            // call this function on every dragend event
            onend: function(event) {

            }
        });

    var offset = {
        x: 0,
        y: 0
    };

    interact('.draggable')
        .resizable({
            edges: {
                left: true,
                right: true,
                bottom: true,
                top: true
            }
        })
        .on('resizemove', function(event) {
            var target = event.target;

            // update the element's style
            target.style.width = event.rect.width + 'px';
            target.style.height = event.rect.height + 'px';

            // translate when resizing from top or left edges
            offset.x += event.deltaRect.left;
            offset.y += event.deltaRect.top;

            target.style.transform = ('translate(' + offset.x + 'px,' + offset.y + 'px)');

            //            target.textContent = event.rect.width + '×' + event.rect.height;
        });

    editorApp = {
        data: {},

        init: function() {
            this.addEventListener();
        },

        addEventListener: function() {
            this.setInlineEdiorDbclick();
        },

        setInlineEdiorDbclick: function() {
            var self = this;
            $('.draggable').dblclick(function() {
                // We need to turn off the automatic editor creation first.
                var targetId = 'drag-me';
                self.editorInit(targetId);
                interact('.draggable').draggable({
                    enabled: false
                });
            })
        },

        editorInit: function(targetId) {
            CKEDITOR.disableAutoInline = true;

            var activeEditor = 0;
            var activeEditorElement = 0;
            var activeId = '';

            // Is there already an editor active?
            if (activeEditor) {

                // Is the active editor the same
                // as the one being requested?
                if (activeEditor.element.getId() == activeId) {
                    // Then our editor is already running
                    // so there's nothing to do!
                    return;
                }
                activeEditor.destroy();
            }

            // Find the element that we want to
            // attach the editor to
            if (!(activeEditorElement = document.getElementById(targetId))) {
                return;
            }

            // TODO - verify that the element is either a
            // div or a textarea which are the only two
            // element types supporting contenteditable=true

            // Make the element editable
            activeEditorElement.setAttribute('contenteditable', 'true');

            // Create a new inline editor for this div
            activeEditor = CKEDITOR.inline(targetId, {
                skin: 'flat',
                toolbar: [{
                        name: 'basicstyles',
                        groups: ['basicstyles', 'cleanup'],
                        items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', ]
                    }, {
                        name: 'paragraph',
                        groups: ['list', 'align', ],
                        items: ['NumberedList', 'BulletedList', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']
                    },
                    '/', {
                        name: 'styles',
                        items: ['Styles', 'Format', 'Font', 'FontSize']
                    }, {
                        name: 'colors',
                        items: ['TextColor', 'BGColor']
                    }
                ],

                //                    { name: 'styles', items: [ 'Styles', 'Format', 'Font', 'FontSize' ] },
                docType: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
                font_defaultLabel: '굴림',
                font_names: '굴림/Gulim;돋움/Dotum;바탕/Batang;궁서/GungSeo;한나/BM-HANNAStd;Arial/Arial;Comic Sans MS/Comic Sans MS;Courier New/Courier New;Georgia/Georgia;Lucida Sans Unicode/Lucida Sans Unicode;Tahoma/Tahoma;Times New Roman/Times New Roman;Trebuchet MS/Trebuchet MS;Verdana/Verdana',
                fontSize_defaultLabel: '22px',
                fontSize_sizes: '8/8px;9/9px;10/10px;11/11px;12/12px;14/14px;16/16px;18/18px;20/20px;22/22px;24/24px;26/26px;28/28px;36/36px;48/48px;',
                language: "ko",
                resize_enabled: true
            });

            // Set up a destruction function that will occur
            // when the user clicks out of the editable space
            activeEditor.on('blur', function() {
                this.element.setAttribute('contenteditable', 'false');
                activeId = '';
                activeEditor = 0;
                activeEditorElement = 0;

                interact('.draggable')
                    .draggable({
                        // enable inertial throwing
                        inertia: true,
                        // keep the element within the area of it's parent
                        restrict: {
                            restriction: "parent",
                            endOnly: true,
                            elementRect: {
                                top: 0,
                                left: 0,
                                bottom: 1,
                                right: 1
                            }
                        },

                        // call this function on every dragmove event
                        onmove: function(event) {
                            var target = event.target,
                                // keep the dragged position in the data-x/data-y attributes
                                x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
                                y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                            // translate the element
                            target.style.webkitTransform =
                                target.style.transform =
                                'translate(' + x + 'px, ' + y + 'px)';

                            // update the posiion attributes
                            target.setAttribute('data-x', x);
                            target.setAttribute('data-y', y);
                        },
                        // call this function on every dragend event
                        onend: function(event) {

                        }
                    });

                this.destroy();
            });

            // Now set the focus to our editor so
            // that it will open up for business
            activeEditorElement.focus();
        }
    }

    editorApp.init();

    var canvas = document.getElementById("main-canvas");
    // rasterizeHTML.drawHTML('<img src="test.jpg" alt="" id="main-target" style="height: 150px; min-width: 100%; -webkit-filter: grayscale(0%) blur(1px) brightness(62%) contrast(141%) hue-rotate(0deg) opacity(100%) invert(0%) saturate(100%) sepia(0%);">', canvas);
};

Template.Editor.destroyed = function() {};

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