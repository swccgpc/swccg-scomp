'use strict';
var cardSearchApp = angular.module('cardSearchApp', ['ui.bootstrap', 'ui.bootstrap.tabs', 'ui.select', 'ngSanitize']);

/*
cardSearchApp.config(function(uiSelectConfig) {
  uiSelectConfig.theme = 'selectize';
  uiSelectConfig.resetSearchInput = true;
  uiSelectConfig.appendToBody = true;
});
*/
cardSearchApp.config(function($locationProvider) { $locationProvider.html5Mode({enabled: true, requireBase: false}); });

cardSearchApp.filter('to_trusted', ['$sce', function($sce){
    return function(text) {
      console.log('trusting: ' + text);
        return $sce.trustAsHtml(text);
    };
}]);
