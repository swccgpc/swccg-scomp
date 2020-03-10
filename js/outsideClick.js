'use strict';
/* globals $ */
var cardSearchApp = angular.module('cardSearchApp');
cardSearchApp.directive("outsideClick", ['$document', function( $document ){
  return {
    link: function( $scope, $element, $attributes ){

      var outsideClickFunc = $scope[$attributes.outsideClick];

      // Only turn this on if the element is active
      var outsideClickDetectionActive = false;

      var onDocumentClick = function(event){

        if ($element.is(':visible') && outsideClickDetectionActive) {

          var isTargetStillShowing = $(event.target).is(':visible');

          var isChild = $element.find(event.target).length > 0;
          var isSelf = ($element.length > 0) && ($element[0] === event.target);
          if (isTargetStillShowing && !isChild && !isSelf) {
            outsideClickFunc(event);
            //outsideClickDetectionActive = false;
            $scope.$apply();
          }
        }
      };

      $document.on("click", onDocumentClick);

      $element.bind('beforeShow', function () {
        brieflyIgnoreEvents();
      });

      $element.bind('afterShow', function () {
        brieflyIgnoreEvents();
      });

      $element.on('$destroy', function() {
        $document.off("click", onDocumentClick);
      });

      function brieflyIgnoreEvents() {
        setTimeout(function() {
          outsideClickDetectionActive = true;
        }, 500);
      }

      // When we come up, ignore events ever-so-briefly and then start listening again
      brieflyIgnoreEvents();
    }
  };
}]);
