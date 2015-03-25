Meteor.startup(function () {
});


ServiceConfiguration.configurations.remove({
    service: 'facebook'
});

ServiceConfiguration.configurations.insert({
    service: 'facebook',
    appId: '1584785935107257',
    secret: '9ce743736d7d701bda325e3849427cb6'
});