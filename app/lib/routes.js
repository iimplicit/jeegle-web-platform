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