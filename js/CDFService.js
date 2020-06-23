"use strict";
var cardSearchApp = angular.module('cardSearchApp');
cardSearchApp.service('CDFService', [function() {

  /*
  var CARD_TYPES = {
    ALL: "ALL",
    ADMIRALS_ORDER: "ADMIRALS_ORDER",
    CHARACTER: "CHARACTER",
    CREATURE: "CREATURE",
    DEVICE: "DEVICE",
    DEFENSIVE_SHIELD: "DEFENSIVE_SHIELD",
    EFFECT: "EFFECT",
    EPIC_EVENT: "EPIC_EVENT",
    INTERRUPT: "INTERRUPT",
    JEDI_TEST: "JEDI_TEST",
    LOCATION: "LOCATION",
    OBJECTIVE: "OBJECTIVE",
    Podracer: "PODRACER",
    STARSHIP: "STARSHIP",
    VEHICLE: "VEHICLE",
    WEAPON: "WEAPON",
    UNKNOWN: "UNKNOWN"
  };
  */

  var CARD_TYPE_SEARCH_STRING = {
    ADMIRALS_ORDER: "admiral",
    CHARACTER: "character",
    CREATURE: "creature",
    DEVICE: "device",
    DEFENSIVE_SHIELD: "defensive",
    EFFECT: "effect",
    EPIC_EVENT: "epic",
    INTERRUPT: "interrupt",
    JEDI_TEST: "jedi test",
    LOCATION: "location",
    OBJECTIVE: "objective",
    PODRACER: "podracer",
    STARSHIP: "starship",
    VEHICLE: "vehicle",
    WEAPON: "weapon"
  };


  this.getTypeSearchStringFromType = function(cardTypeEnum) {
    if (CARD_TYPE_SEARCH_STRING[cardTypeEnum]) {
      return CARD_TYPE_SEARCH_STRING[cardTypeEnum];
    }
    return "";
  };


  function cardsFromCdfData(data) {
    var cards = [];

    // By lines
    var lines = data.split('\n');
    for(var line = 0; line < lines.length; line++){
      var lineInfo = lines[line];

      if (0 === lineInfo.indexOf("card")) {
        //console.log("Detected Card: " + lineInfo);

        var isLegacy = false;

        // Ignore Legacy cards
        if (-1 !== lineInfo.indexOf('card "/legacy')) {
          isLegacy = true;
        }
        if (-1 !== lineInfo.indexOf('card "/TWOSIDED/legacy')) {
          isLegacy = true;
        }

        // Get the card name from the line
        var card = cardFromLine(lineInfo);
        if (card) {
          card.legacy = isLegacy;
          //console.log("Card: " + JSON.stringify(card));
          cards.push(card);
        }
      }
    }

    return cards;
  }
  this.cardsFromCdfData = cardsFromCdfData;

  function fixSlashes(str) {
    return str;
    /*
    while (str.indexOf('/') !== -1) {
      str = str.replace('/', '\\');
    }
    return str;
    */
  }

  function cardFromLine(cardLine) {

    if (cardLine.indexOf("card") !== 0) {
      return null;
    }

    var twoSided = false;
    if (cardLine.indexOf('TWOSIDED') !== -1) {
      twoSided = true;
    }

    var card = {
      conceptBy: "",
      errataInfo: "",
      links: [],
      links_large: [],
      ability: "",
      armor: "",
      characteristics: "",
      darkSideIcons: "",
      destiny: "",
      deploy: "",
      extraText: "",
      ferocity: "",
      forfeit: "",
      lore: "",
      gametext: "",
      hyperspeed: "",
      icons: "",
      landspeed: "",
      lightSideIcons: "",
      maneuver: "",
      parsec: "",
      politics: "",
      power: "",
      title: "",
      titleSortable: "",
      type: "",
      set: "",
      setAbbreviation: "",
      side: "",
      subType: "",
      twoSided: twoSided,
      uniqueness: ""
    };


    // Full Line:
    // card "/starwars/DeathStarII-Dark/t_accuser" "Accuser (1)\nDark Starship - Capital: Imperial-Class Star Destroyer [R]\nSet: Death Star II\nPower: 7 Armor: 5 Hyperspeed: 4\nDeploy: 8 Forfeit: 9\nIcons: Pilot, Nav Computer, Scomp Link\n\nLore: Modified for optimal crisis response time. Veteran crew experienced at monitoring shipping lanes and Imperial port traffic.\n\nText: May deploy -3 as a 'react'. May add 6 pilots, 8 passengers, 2 vehicles and 4 TIEs. Has ship-docking capability. Permanent pilot provides ability of 1."
    var iFirstSpace = cardLine.indexOf(" ");
    var iSecondSpace = cardLine.indexOf(" ", iFirstSpace + 1);
    processLinks(cardLine, card);

    var cardData = cardLine.substring(iSecondSpace + 2).trim();

    //console.log(cardLine);



    // Every decent browser can handle this...but not IE. See below...
    /*
    cardData = cardData.replace("\"\�", "•"); //jshint ignore:line
    cardData = cardData.replace("\�", "•"); //jshint ignore:line
    cardData = cardData.replace("\�", "•"); //jshint ignore:line
    cardData = cardData.replace("\�", "•"); //jshint ignore:line
    */

    //cardData = cardData.replace(/�/g, "\x95"); //jshint ignore:line
    //cardData = cardData.replace(/�/g, "ï"); //jshint ignore:line
    //cardData = cardData.replace(/�/g, "•");  //jshint ignore:line
    cardData = cardData.replace(/[^\x00-\x80]/g, "\u2022"); // //jshint ignore:line


    // For Internet Explorer stupidity (replace any garbage characters with  the uniqueness-dot
    //cardData = cardData.replace(/[^\x00-\x80]/g, "•"); // //jshint ignore:line
    //cardData = cardData.replace(/[^\x00-\x80]/g, "\x95"); // //jshint ignore:line
    //cardData = cardData.replace(/[^\x00-\x80]/g, "\u2022"); // //jshint ignore:line

    // Split Lines
    // "Accuser (1)\n
    // Dark Starship - Capital: Imperial-Class Star Destroyer [R]\n
    // Set: Death Star II\n
    // Power: 7 Armor: 5 Hyperspeed: 4\n
    // Deploy: 8 Forfeit: 9\n
    // Icons: Pilot, Nav Computer, Scomp Link\n\n
    // Lore: Modified for optimal crisis response time. Veteran crew experienced at monitoring shipping lanes and Imperial port traffic.\n\n
    // Text: May deploy -3 as a 'react'. May add 6 pilots, 8 passengers, 2 vehicles and 4 TIEs. Has ship-docking capability. Permanent pilot provides ability of 1."

    // Split the card into it's fields
    var cardFields = cardData.split("\\n");
    for (var j = 0; j < cardFields.length; j++) {
      if (j === 0) {
        processTitleLine(cardFields[j].trim(), card);
      } else if (j === 1) {
        processTypeLine(cardFields[j].trim(), card);
      } else {
        processLabeledLine(cardFields[j].trim(), card);
      }
    }

    return card;
  }



  function getPathChunk(cardLine) {
    // card "/legacy/Virtual9-Dark/t_arenaexecution" "Arena Execution...
    var iFirstSpace = cardLine.indexOf(" ");
    var iSecondSpace = cardLine.indexOf(" ", iFirstSpace + 1);
    var cardPathChunk = cardLine.substring(iFirstSpace+2, iSecondSpace-1);
    return cardPathChunk;
  }

  function processLinks(cardLine, card) {
    var cardPathChunk = getPathChunk(cardLine);
    cardPathChunk = fixSlashes(cardPathChunk);

    var files = [];
    var front = null;
    var back = null;

    var file1Start = cardPathChunk.indexOf("t_");
    var folderString = cardPathChunk.substring(0, file1Start);

    // Remove the TWOSIDED indicator
    folderString = folderString.replace("TWOSIDED/", "");
    var iLastFolderSlash = folderString.lastIndexOf('/');

    var folderStringLarge = folderString.slice(0, iLastFolderSlash) + "/large/" + folderString.slice(iLastFolderSlash+1);

    var allFilesString = cardPathChunk.substring(file1Start);
    var iSecondImageDivider = allFilesString.indexOf("\/");
    if (iSecondImageDivider !== -1) {
      // This is a two-sided card!
      front = allFilesString.substring(0, iSecondImageDivider);
      back = allFilesString.substring(iSecondImageDivider+1);
      files.push(front);
      files.push(back);
    } else {
      front = allFilesString;
      files.push(front);
    }

    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      var link = "cards" + folderString + file.trim() + ".gif";
      card.links.push(link);

      var largeLink = "cards" + folderStringLarge + file.trim() + ".gif";
      largeLink = largeLink.replace("t_", "");
      card.links_large.push(largeLink);
    }

  }


  function processTypeLine(line, card) {
    // Dark Starship - Capital: Imperial-Class Star Destroyer [R]\n

    var indexOfRarity = line.lastIndexOf("[");
    var lastBracketIndex = line.lastIndexOf("]");
    if ((indexOfRarity !== -1) && (lastBracketIndex !== -1)) {

      // Get Rarity
      card.rarity = line.substring(indexOfRarity+1, lastBracketIndex);


      // The 'Type' line looks like one of the below:
      // Dark Admiral's Order [R]
      // Dark Character - Dark Jedi Knight [R]

      // First, remove the rarity
      var fullTypeLine = line.substring(0, indexOfRarity).trim();

      // Get the Side (first word)
      if (fullTypeLine.indexOf("Dark") === 0) {
        card.side = "Dark";
      }
      if (fullTypeLine.indexOf("Light") === 0){
        card.side = "Light";
      }

      // Remove the Dark/Light from the beginning of the type string
      fullTypeLine = fullTypeLine.replace("Dark", "").trim();
      fullTypeLine = fullTypeLine.replace("Light", "").trim();


      // Get Basic Type
      var endOfBaseType = fullTypeLine.length;
      var indexOfDash = fullTypeLine.indexOf('-');
      if (indexOfDash > -1) {
        endOfBaseType = indexOfDash;
      }
      var type = fullTypeLine.substring(0, endOfBaseType).trim();


      card.type = type;

      // Get Full Type
      card.subType = fullTypeLine.substring(endOfBaseType + 2); //.replace("Dark", "").replace("Light", "").trim();
    }

  }

  function getSimpleName(cardName) {
    var titleSortable = cardName.replace("•", "");
    titleSortable = titleSortable.replace("•", "");
    titleSortable = titleSortable.replace("•", "");
    titleSortable = titleSortable.replace("•", "");

    titleSortable = titleSortable.replace("<>", "");
    titleSortable = titleSortable.replace("<>", "");
    titleSortable = titleSortable.replace("<>", "");

    titleSortable = titleSortable.toLowerCase();
    titleSortable = titleSortable.replace("é", "e");

    titleSortable = titleSortable.replace("ï¿½", "e");

    titleSortable = titleSortable.replace(/\'/g, "");
    titleSortable = titleSortable.replace(/\"/g, "");

    return titleSortable;
  }
  this.getSimpleName = getSimpleName;

  function processTitleLine(line, card) {
    card.title = line.trim();

    var iDestinyStart = line.lastIndexOf('(');
    var iDestinyEnd = line.lastIndexOf(')');
    if ((iDestinyStart !== -1) && (iDestinyEnd !== -1)) {
      card.title = line.substring(0, iDestinyStart-1).trim();
      card.destiny = line.substring(iDestinyStart+1, iDestinyEnd);
    }
    card.titleSortable = getSimpleName(card.title);
    card.titleLowerNoSet = removeSetFromTitle(card.titleSortable);
  }

  function removeSetFromTitle(title) {
    // See if the title ends with "......... (CC)" or "..... (EP1)"
    var replaced = title.replace(/\(..\)/ig, "").toLowerCase().trim();
    replaced = replaced.replace(/\(...\)/ig, "").toLowerCase().trim();
    //replaced = title.replace(/\(.*.*\)/i, "").toLowerCase().trim();

    return replaced;
  }
  this.removeSetFromTitle = removeSetFromTitle;

  function processLabeledLine(line, card){

    // Handle the full special lines first!
    if (line.indexOf("Text:") === 0) {
      card.gametext += line.substring(6).trim();
      return;
    } else if (line.indexOf("Lore:") === 0) {
      card.lore += line.substring(6).trim();
      return;
    } else if (line.indexOf("Set:") === 0) {
      card.set = line.substring(5).trim();
      card.setAbbreviation = getSetAbbreviation(card.set);
      return;
    } else if (line.indexOf("LOST:") === 0) {
      card.gametext += "LOST: " + line.substring(6).trim() + "  ";
      return;
    } else if (line.indexOf("USED:") === 0) {
      card.gametext += "USED: " + line.substring(6).trim() + "  ";
      return;
    } else if (line.indexOf("STARTING:") === 0) {
      card.gametext += "STARTING: " + line.substring(10).trim() + "  ";
      return;
    } else if (line.indexOf("Requirements:") === 0) {
      card.gametext += line + " ";
      return;
    } else if (line.indexOf("Stakes:") === 0) {
      card.gametext += line + " ";
      return;
    } else if (line.indexOf("Clone cards:") === 0) {
      card.gametext += line + " ";
      return;
    } else if (line.indexOf("Wild cards") === 0) {
      card.gametext += line + " ";
      return;
    } else if (line.indexOf("(Original") === 0) {
      card.conceptBy += line;
      return;
    } else if (line.indexOf("(Errata") === 0) {
      card.errataInfo += line;
      return;
    } else if (line.indexOf("Icons:") === 0) {
      var iconsString = line.substring(7).trim();
      card.icons = getIcons(iconsString);
      return;
    } else if (card.type === "Objective") {
      // Special case because Objectives aren't labeled properly... sigh...
      card.gametext += line;
    } else if (line.indexOf("DARK: (") === 0) {
      card.gametext += line;

      var darkIconCount = parseInt(line.substring(8));
      if (darkIconCount) {
        card.darkSideIcons = darkIconCount;
      }
    } else if (line.indexOf("LIGHT: (") === 0) {
      card.gametext += line;

      var lightIconCount = parseInt(line.substring(9));
      if (lightIconCount) {
        card.lightSideIcons = lightIconCount;
      }
    } else if (line.indexOf("LIGHT") === 0) {
      var indexLightOfColon = line.indexOf(":");
      if (indexLightOfColon > 0) {
        card.gametext += "Light: " + line.substring(indexLightOfColon);
      }
    }

    // Power: 7 Armor: 5 Hyperspeed: 4\n
    // Split the line by 'spaces', so:
    // Power:
    // 7
    // Armor:
    // 5

    var isPowerLine = (-1 !== line.indexOf("ower:"));

    var splitLine = line.trim().split(" ");
    var lastFieldNameLower = "";
    for (var i = 0; i < splitLine.length; i++) {

      // Store the 'data' value
      var data = splitLine[i].trim();

      // Fields are labeled, so every other data chunk is a value and it's previous value was the label
      if (i % 2 !== 0) {
        if (lastFieldNameLower === "power:") {
          card.power = data;
        } else if (lastFieldNameLower === "maneuver:") {
          card.maneuver = data;
        } else if (lastFieldNameLower === "armor:") {
          card.armor = data;
        } else if (lastFieldNameLower === "hyperspeed:") {
          card.hyperspeed = data;
        } else if (lastFieldNameLower === "landspeed:") {
          card.landspeed = data;
        } else if (lastFieldNameLower === "deploy:") {
          card.deploy = data;
        } else if (lastFieldNameLower === "forfeit:") {
          card.forfeit = data;
        } else if (lastFieldNameLower === "ability:") {
          card.ability = data;
        } else if (lastFieldNameLower === "influence:") {
          card.influence = data;
        } else if (lastFieldNameLower === "ferocity:") {
          card.ferocity = data;
        } else if (lastFieldNameLower === "used:") {
          card.gametext += "USED:  " + data + "\n";
        } else if (lastFieldNameLower === "lost:") {
          card.gametext += "LOST: " + data + "\n";
        } else if (lastFieldNameLower === "starting:") {
          card.gametext += "STARTING: " + data + "\n";
        } else if (lastFieldNameLower === "politics:") {
          card.politics = data;
        } else if (lastFieldNameLower === "parsec:") {
          card.parsec = data;
        } else if (lastFieldNameLower === "ferocity:") {
          card.ferocity = data;
        }


      } else{
        lastFieldNameLower = data.toLowerCase().trim();

        if (isPowerLine &&  (-1 === lastFieldNameLower.indexOf(":"))) {
          // We are on the power line, and just encountered non-labeled text.
          // This (and the rest of the line) must be things like "Force-Sensitive" or "Jedi Knight", "Assassin Droid", etc
          for (var j = i; j < splitLine.length; j++) {
            card.extraText += " " + splitLine[j];
            card.extraText = card.extraText.trim();
          }

        }

      }
    }
  }

  function getSetAbbreviation(setName) {
    switch (setName) {
      case "Premier": {
        return "PR";
      }
      case "A New Hope": {
        return "ANH";
      }
      case "Dagobah": {
        return "DAG";
      }
      case "Jabba's Palace": {
        return "JP";
      }
      case "Cloud City": {
        return "CC";
      }
      case "Special Edition": {
        return "SE";
      }
      case "Endor": {
        return "EDR";
      }
      case "Death Star II": {
        return "DS2";
      }
      case "Tatooine": {
        return "TAT";
      }
      case "Coruscant": {
        return "COR";
      }
      case "Theed Palace": {
        return "TP";
      }
      case "Reflections I": {
        return "Ref1";
      }
      case "Reflections II": {
        return "Ref2";
      }
      case "Reflections III": {
        return "Ref3";
      }
      case "Demo Deck": {
        return "Demo";
      }
      default: {
        var abbreviation = "";
        var splitWords = setName.split(" ");

        if (-1 !== setName.indexOf("Virtual Set")) {
          return setName.replace("Virtual Set ", "V");
        }

        for (var i = 0; i < splitWords.length; i++) {
          var firstLetter = splitWords[i].substring(0, 1);
          abbreviation += firstLetter.toUpperCase();
        }
        return abbreviation;
      }
    }
  }
  this.getSetAbbreviation = getSetAbbreviation;


  function getIcons(iconsString) {
    // Icons: Warrior, Pilot, Separatist, Episode 1

    // To match the parsing in SWIP, add "<br> between icons
    while (-1 !== iconsString.indexOf(",")) {
      iconsString = iconsString.replace(",", "<br>");
    }
    return iconsString;
  }



  /**
   * Builds a mapping of:
   * {
   *   'type"; ["interrupt", "effect", "character"],
   *   'subType"; ["used interrupt", "utinni effect", "rebel', 'alient'],
   *   'characteristics': [ 'Black Sun Agent', 'ISB Agent', ...],
   *   'side': [ 'light', 'dark']
   *   'set': ['Tatooine', 'Death Star II', etc]
   *   ...
   * }
   */
  function getCardValueMap(cards) {

    var fieldValueMap = {};

    // Add every field we know about based on the card DB
    cards.forEach(function(card) {
      for (var field in card.front) { //jshint ignore:line
        fieldValueMap[field] = null;
      }
    });

    // Add auto-complete to specific fields
    fieldValueMap.type = getValuesForFieldName('type', cards);
    fieldValueMap.subType = getValuesForFieldName('subType', cards);
    fieldValueMap.characteristics = getValuesForFieldName('characteristics', cards);
    fieldValueMap.icons = getValuesForFieldName('icons', cards);
    fieldValueMap.side = getValuesForFieldName('side', cards);
    fieldValueMap.set = getValuesForFieldName('set', cards);
    fieldValueMap.rarity = getValuesForFieldName('rarity', cards);
    fieldValueMap.uniqueness = getValuesForFieldName('uniqueness', cards);
    fieldValueMap.darkSideIcons = getValuesForFieldName('darkSideIcons', cards);
    fieldValueMap.lightSideIcons = getValuesForFieldName('lightSideIcons', cards);

    // Remove fields that we don't want to show to the user
    delete fieldValueMap.setAbbreviation;
    delete fieldValueMap.links;
    delete fieldValueMap.links_large;
    delete fieldValueMap.titleSortable;
    delete fieldValueMap.titleLowerNoSet;
    delete fieldValueMap.twoSided;
    delete fieldValueMap.id;
    delete fieldValueMap.imageUrl;

    return fieldValueMap;
  }
  this.getCardValueMap = getCardValueMap;


  function getValuesForFieldName(fieldName, cards) {

    // Keep a hash for quick access
    /*
    var possibleValues = {
      'Black Sun Agent': true,
      'ISB Agent': true
    };
    */
    var possibleValues = {};

    // Get possibilities for each card
    for (var i = 0; i < cards.length; i++) {
      var fullCard = cards[i];

      var card = fullCard.front;

      var values = [];

      if (card[fieldName] && Array.isArray(card[fieldName])) {
        values = values.concat(card[fieldName]);
      } else if (card[fieldName] && typeof card[fieldName] === 'string') {
        values.push(card[fieldName]);
      }

      for (var j = 0; j < values.length; j++) {
        if (!values[j]) {
          var p = 0;
        }
        var value = values[j].toLowerCase();
        possibleValues[value] = true;
      }
    }

    // Now, consolidate all of those values into an array
    var possibleValueArray = [];
    for (var val in possibleValues) { //jshint ignore:line
      possibleValueArray.push(val);
    }
    return possibleValueArray;
  }
  this.getValuesForFieldName = getValuesForFieldName;
}]);
