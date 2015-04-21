Router.configure({
  layoutTemplate: 'MasterLayout',
  loadingTemplate: 'Loading',
  notFoundTemplate: 'NotFound'
});

Router.route('/', {
  name: 'home',
  controller: 'HomeController',
  action: 'action',
  where: 'client'
});


Router.route('editor', {
  name: 'editor',
  controller: 'EditorController',
  action: 'action',
  where: 'client'
});

Router.route('workpiece/:_id', {
  name: 'workpiece',
  controller: 'WorkpieceController',
  action: 'action',
  where: 'client'
});

// Router.route('music', {where: 'server'}).get(function() {
//   this.response.writeHead(302, {
//     'Location': "bpc://landing?type=play_radio&amp;channel_id=136"
//   });
//   this.response.end();
// });

Router.route('music/:_id', {
  name: 'music',
  controller: 'MusicController',
  action: 'action',
  where: 'client'
});

Router.route('policy', {
  name: 'policy',
  controller: 'PolicyController',
  action: 'action',
  where: 'client'
});