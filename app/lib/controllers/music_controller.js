MusicController = RouteController.extend({
    subscriptions: function() {},

    data: function() {
        // return {
        //     musicId: this.params._id
        // }
    },
    action: function() {
        var isMobile = {
            Android: function() {
                return navigator.userAgent.match(/Android/i);
            },
            BlackBerry: function() {
                return navigator.userAgent.match(/BlackBerry/i);
            },
            iOS: function() {
                return navigator.userAgent.match(/iPhone|iPad|iPod/i);
            },
            Opera: function() {
                return navigator.userAgent.match(/Opera Mini/i);
            },
            Windows: function() {
                return navigator.userAgent.match(/IEMobile/i);
            },
            any: function() {
                return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
            }
        };

        // 상황에 따라서 다른 state를 설정해줘서, 이 state에 따라서 탬플릿이 보여지게 됩니다.
        if (isMobile.Android()) {
            // 안드로이드의 경우 Facebook의 custom story가 자동으로 redirect를 해줍니다.
        } else if (isMobile.iOS()) {
            // iOS의 경우 받은 musicId를 파라미터를 그대로 탬플릿단으로 전달해주고, 해당 'Music' 탬플릿을 render 해줍니다.
            this.render('Music', {
                data: {
                    musicId: this.params._id
                }
            });
        } else {
            // Web의 경우 Workpiece 탬플릿을 render 해줍니다.
            // this.render('Workpiece', {
            //     data: {
            //
            //     }
            // });
            this.render('Home');
        }
    }
});
