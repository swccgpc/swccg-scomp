"use strict";
var cardSearchApp = angular.module('cardSearchApp');
cardSearchApp.service('ExportService', ['$timeout', function($timeout) {


  function cardSortFunc(a, b) {
    // Sort by "Type - Subtype", "title", "set"
    if (a.typeAndSubtype < b.typeAndSubtype) {
      return -1;
    } else if (a.typeAndSubtype > b.typeAndSubtype) {
      return 1;
    } else {

      if (a.titleSortable < b.titleSortable) {
        return -1;
      } else if (a.titleSortable > b.titleSortable) {
        return 1;
      } else {

        if (!a.links || a.links.length === 0) {
          return 0;
        }
        if (a.links[0] < b.links[0]) {
          return -1;
        } else if (a.links[0] > b.links[0]) {
          return 1;
        } else {
          return 0;
        }

      }

    }
  }


  function getCardsOfSide(includeLight, includeDark, cardList) {
    var cardsOfSide = [];

    for (var i = 0; i < cardList.length; i++) {
      var card = cardList[i];
      if (includeLight && card.side === "Light") {
        cardsOfSide.push(card);
      }
      if (includeDark && card.side === "Dark") {
        cardsOfSide.push(card);
      }
    }

    return cardsOfSide;
  }

  function buildArrayFromCsv(str) {
    if (!str) {
      return null;
    }
    var stringArray = str.split(/(<br>)/);
    var cleanArray = [];
    for (var i = 0; i < stringArray.length; i++) {
      var item = stringArray[i].trim();
      if (item !== "<br>" && item !== "-----") {
        cleanArray.push(item);
      }
    }

    return cleanArray;
  }

  function buildArrayFromDashDelimiter(str) {
    if (!str) {
      return null;
    }
    var stringArray = str.split(/(\-\-\-\-\-)/);
    var cleanArray = [];
    for (var i = 0; i < stringArray.length; i++) {
      var item = stringArray[i].trim();
      item = item.replace(/<br>/g, "");
      if (item !== "" && item !== "<br>" && item !== "-----") {
        cleanArray.push(item);
      }
    }

    return cleanArray;
  }


  function getNumber(str) {

    if (str === null || (typeof str === 'undefined') || str === "") {
      return null;
    }

    if (str === "*" || -1 !== str.indexOf("Pi")) {
      return str;
    }

    return Number(str);
  }

  function getNewLink(link) {
    // For now, point directly at the Holotable repo in GitHub
    // https://github.com/swccgpc/holotable/blob/master/Images-HT/starwars/ANewHope-Dark/large/advosze.gif?raw=true

    var indexOfStarWars = link.indexOf("starwars");
    var linkFromStarWars = link.substring(indexOfStarWars);
    var newLink = "https://github.com/swccgpc/holotable/blob/master/Images-HT/" + linkFromStarWars + "?raw=true";
    return newLink;
  }


  function exportCdf(exportLight, exportDark, allCards, fileName) {

    var cardList = getCardsOfSide(exportLight, exportDark, allCards);

    // Sort by sub-type
    cardList = cardList.sort(cardSortFunc);

    var allCardsArray = [];

    for (var i = 0; i < cardList.length; i++) {

      var card = cardList[i];

      var gametext = card.gametext;
      if (gametext !== null) {
        if (gametext[gametext.length-1] === "\"") {
          gametext = gametext.substring(0, gametext.length-1);
        }
        gametext = gametext.trim();
      }

      var front = {
        title: card.title,
        imageUrl: getNewLink(card.links_large[0]),
        type: card.type,
        subTypesString: card.subType,
        uniqueness: card.uniqueness,
        destiny: getNumber(card.destiny),
        power: getNumber(card.power),
        ability: getNumber(card.ability),
        armor: getNumber(card.armor),
        maneuver: getNumber(card.maneuver),
        hyperspeed: getNumber(card.hyperspeed),
        landspeed: getNumber(card.landspeed),
        politics: getNumber(card.politics),
        ferocity: card.ferocity,
        deploy: getNumber(card.deploy),
        forfeit: getNumber(card.forfeit),
        creatureDefenseValue: getNumber(card.creatureDefenseValue),
        icons: buildArrayFromCsv(card.icons),
        lightSideIcons: getNumber(card.lightSideIcons),
        darkSideIcons: getNumber(card.darkSideIcons),
        characteristics: buildArrayFromCsv(card.characteristics),
        gametext: gametext,
        lore: card.lore,
        extraText: buildArrayFromCsv(card.extraText),
        parsec: getNumber(card.parsec)
      };

      var back = null;
      if (card.twoSided && card.links_large.length >= 2) {
        back = JSON.parse(JSON.stringify(front));
        back.imageUrl = getNewLink(card.links_large[1]);
      }

      var newCard = {
        id: card.id,
        side: card.side,
        rarity: card.rarity,
        set: card.set,
        front: front,
        back: back,
        conceptBy: card.conceptBy,
        pulls: buildArrayFromCsv(card.pulls),
        pulledBy: buildArrayFromCsv(card.pulledBy),
        counterpart: card.counterpart,
        combo: buildArrayFromDashDelimiter(card.combo),
        matching: buildArrayFromCsv(card.matching),
        matchingWeapon: buildArrayFromCsv(card.matchingWeapon),
        canceledBy: buildArrayFromCsv(card.canceledBy),
        cancels: buildArrayFromCsv(card.cancels),
        abbreviation: card.abbreviation,
        legacy: card.legacy
      };

      newCard = removeEmpty(newCard);

      allCardsArray.push(newCard);
    }

    var allCardsData = {
      cards: allCardsArray
    };

    // Save this data into a download...
    stringToDownload(JSON.stringify(allCardsData, null, '  '), fileName);
  }
  this.exportCdf = exportCdf;


  function removeEmpty(obj) {
    Object.keys(obj).forEach(function(key) {
      (obj[key] && typeof obj[key] === 'object') && removeEmpty(obj[key]) ||
      (obj[key] === '' || obj[key] === null) && delete obj[key]
    });
    return obj;
  }

  function stringToDownload(str, fileName) {
    var text = str;
    var filename = fileName;

    var elementId = "DOWNLOAD_DATA_ELEMENT_ID";
    var element = angular.element('<a id="' + elementId + '">ClickMe</a>');
    //element.attr('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    var encodedData = encodeURIComponent(text);
    console.log("Encoded length: " + encodedData.length);

    element.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.attr('download', filename);

    //var compiled = $compile(element)($scope);

    //element.css("display", 'none');

    var body = angular.element(document).find('body').eq(0);
    body.append(element);

    $timeout(function(){
      element.get(0).click();

      $timeout(function() {
        element.remove();
      }, 5000);

    }, 5000);

  }

}]);
