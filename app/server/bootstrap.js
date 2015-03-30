Meteor.startup(function () {
	var proxy =  Meteor.npmRequire('html2canvas-proxy');
	var express =  Meteor.npmRequire('express');

    var app = express();
    app.use('/', proxy());
});


ServiceConfiguration.configurations.remove({
    service: 'facebook'
});

ServiceConfiguration.configurations.insert({
    service: 'facebook',
    appId: '1584785935107257',
    secret: '9ce743736d7d701bda325e3849427cb6'
});