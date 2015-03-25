/*****************************************************************************/
/* Editor: Event Handlers */
/*****************************************************************************/
Template.Editor.events({});

/*****************************************************************************/
/* Editor: Helpers */
/*****************************************************************************/
Template.Editor.helpers({});

/*****************************************************************************/
/* Editor: Lifecycle Hooks */
/*****************************************************************************/
Template.Editor.created = function() {};

Template.Editor.rendered = function() {
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
    function imageApp(){
    }

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
            }
        }
    }

    var app = new imageApp();
    app.init();
};

Template.Editor.destroyed = function() {};

function getDifference(absoluteValue) {
    var originalValue = Session.get("filter");
    var difference = originalValue.brightness - absoluteValue;
    originalValue.brightness = absoluteValue;
    Session.set("filter", originalValue);
    return difference *= -1;
}