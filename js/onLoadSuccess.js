'use strict';

var myApp = angular.module('cardSearchApp');
myApp.directive('onLoadSuccess', ['$timeout', function($timeout) {
    return {
        link: function(scope, element, attrs) {
          var successFunc = scope[attrs.onLoadSuccess];
          element.bind('load', function() {
            if (successFunc) {
              // Do this in a $timeout so that Angular sees the change
              $timeout(function() {
                successFunc();
              });
            }
          });
        }
    };
}]);
