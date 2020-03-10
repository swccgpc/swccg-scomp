'use strict';

var myApp = angular.module('cardSearchApp');
myApp.directive('onLoadError', ['$timeout', function($timeout) {
    return {
        link: function(scope, element, attrs) {
          var errorFunc = scope[attrs.onLoadError];
          element.bind('error', function() {
            if (errorFunc) {
              // Do this in a $timeout so that Angular sees the change
              $timeout(function() {
                errorFunc();
              });
            }
          });
        }
    };
}]);
