"use strict";
var cardSearchApp = angular.module('cardSearchApp');
cardSearchApp.service('SWIPService', ['CDFService', function(CDFService) {

  /*
  * To get data out of SWIP:
    1) Compile sqlite2  (3 does NOT work with the db)
    2) ./sqlite -header swccg_db.sdb "select id,CardName,Grouping,Expansion,Uniqueness,Characteristics,Pulls,LightSideIcons,DarkSideIcons,IsPulled,Counterpart,Combo,Matching,MatchingWeapon,Cancels,IsCanceledBy from SWD;" | iconv -f utf-8 -t utf-8 --unicode-subst=e --byte-subst=e > swipdump.text
  */


  /**
 * 1) compile sqlite2
 * 2) ./sqlite -header swccg_db.sdb
 * 3) .output swipdump.text
 * 4) select id,CardName,Grouping,Expansion,Uniqueness,Characteristics,Pulls,LightSideIcons,DarkSideIcons,IsPulled,Counterpart,Combo,Matching,MatchingWeapon,Cancels,IsCanceledBy from SWD;
 * 5) .quit
 * 6) File is now saved as 'swipdump.txt'. However, the character encoding is wrong.
 * 7) vi swipdump.text
 *    7a) :set fileencoding=utf-8
 *    7b) :wq!
 *
 * The dumped results are now ready for upload and are in 'swipdump.text'


 /**
  * Updating SWIP:
  1. ./sqlite swccg_db.sdb
  2. .dump dumpdata.text
  3. Manual open dumpdata.text
    - copy a related line and paste it down towards the bottom with a new number
  4. ./sqlite swccg_imported.sdb
  5. .read dumpdata.text
  Database now has the latest information!



  // Added
  /*
  Characteristics
  LightSideIcons
  DarkSideIcons
  Uniqueness

  */

  // id|CardName|Grouping|CardType|Subtype|ModelType|Expansion|Rarity|Uniqueness|Characteristics|Destiny|Power|Ferocity|CreatureDefenseValue|CreatureDefenseValueName|ObjectiveFront|ObjectiveBack|ObjectiveFrontName|ObjectiveBackName|Deploy|Forfeit|Armor|Ability|Hyperspeed|Landspeed|Politics|Maneuver|ForceAptitude|Lore|Gametext|JediTestNumber|LightSideIcons|DarkSideIcons|LightSideText|DarkSideText|Parsec|Icons|Planet|Space|Mobile|Interior|Exterior|Underground|Creature|Vehicle|Starship|Underwater|Pilot|Warrior|Astromech|PermanentWeapon|SelectiveCreature|Independent|ScompLink|Droid|TradeFederation|Republic|Episode1|Information|Abbreviation|Pulls|IsPulled|Counterpart|Combo|Matching|MatchingWeapon|Rules|Cancels|IsCanceledBy|Inventory|Needs|ExpansionV|Influence|Grabber|Errata|CardNameV|UniquenessV

  /*
  id|
  CardName|
  Grouping|
  CardType|
  Subtype|
  ModelType|
  Expansion|
  Rarity|
  Uniqueness|
  Characteristics|
  Destiny|
  Power|
  Ferocity|
  CreatureDefenseValue|
  CreatureDefenseValueName|
  ObjectiveFront|
  ObjectiveBack|
  ObjectiveFrontName|
  ObjectiveBackName|
  Deploy|
  Forfeit|
  Armor|
  Ability|
  Hyperspeed|
  Landspeed|
  Politics|
  Maneuver|
  ForceAptitude|
  Lore|
  Gametext|
  JediTestNumber|
  LightSideIcons|
  DarkSideIcons|
  LightSideText|
  DarkSideText|
  Parsec|
  Icons|
  Planet|
  Space|
  Mobile|
  Interior|
  Exterior|
  Underground|
  Creature|
  Vehicle|
  Starship|
  Underwater|
  Pilot|
  Warrior|
  Astromech|
  PermanentWeapon|
  SelectiveCreature|
  Independent|
  ScompLink|
  Droid|
  TradeFederation|
  Republic|
  Episode1|
  Information|
  Abbreviation|
  Pulls|
  IsPulled|
  Counterpart|
  Combo|
  Matching|
  MatchingWeapon|
  Rules|
  Cancels|
  IsCanceledBy|
  Inventory|
  Needs|
  ExpansionV|
  Influence|
  Grabber|
  Errata|
  CardNameV|
  UniquenessV
  */



  /*
    id int,
    CardName text,
    Pulls text,
    IsPulled text,
    Counterpart char(50),
    Combo text,
    Matching char(50),
    MatchingWeapon char(50),
    Rules text,
    Cancels text,
    IsCanceledBy text,
    Inventory int,
    Needs int,
    ExpansionV VARCHAR(40),
    Influence char(4),
    Grabber char(4),
    Errata char(4),
    CardNameV char(80),
    UniquenessV char(6));
  */

  var idHeaderIndex = -1;
  var nameHeaderIndex = -1;
  var sideIndexHeader = -1;
  var expansionIndexHeader = -1;
  var pullsHeaderIndex = -1;
  var isPulledHeaderIndex = -1;
  var counterpartHeaderIndex = -1;
  var comboHeaderIndex = -1;
  var matchingHeaderIndex = -1;
  var matchingWeaponHeaderIndex = -1;
  var isCanceledByHeaderIndex = -1;
  var cancelsHeaderIndex = -1;
  var abreviationHeaderIndex = -1;
  var characteristicsHeaderIndex = -1;
  var lightSideIconsHeaderIndex = -1;
  var darkSideIconsHeaderIndex = -1;
  var uniquenessHeaderIndex = -1;

  function getDataAtIndex(splitData, index) {
    if (index !== -1 && splitData[index]) {
      return splitData[index];
    }
    return "";
  }

  function getId(splitData) {
    return parseInt(getDataAtIndex(splitData, idHeaderIndex));
  }
  function getSide(splitData) {
    return getDataAtIndex(splitData, sideIndexHeader);
  }
  function getExpansion(splitData) {
    var setName = getDataAtIndex(splitData, expansionIndexHeader);

    // CDF's list the set as "Virtual Set X"
    // SWIP lists the set as "Virtual Card Set #X"
    //
    // Transform SWIP data to match :)
    setName = setName.replace("Enhanced Premiere Pack", "Enhanced Premiere");
    setName = setName.replace("Virtual Card Set #", "Virtual Set ");
    setName = setName.replace("Empire Strikes Back 2 Player", "Empire Strikes Back Introductory Two Player Game");
    setName = setName.replace("Virtual Defensive Shields", "Virtual Set 0");
    setName = setName.replace("Demonstration Deck Premium Card Set", "Demo Deck");
    setName = setName.replace("Premiere 2 Player", "Premiere Introductory Two Player Game");
    return setName;
  }
  function getCharacteristics(splitData) {
    return getDataAtIndex(splitData, characteristicsHeaderIndex);
  }
  function getLightSideIcons(splitData) {
    return getDataAtIndex(splitData, lightSideIconsHeaderIndex);
  }
  function getDarkSideIcons(splitData) {
    return getDataAtIndex(splitData, darkSideIconsHeaderIndex);
  }
  function getUniqueness(splitData) {
    return getDataAtIndex(splitData, uniquenessHeaderIndex);
  }
  function getCardName(splitData) {
    return getDataAtIndex(splitData, nameHeaderIndex);
  }
  function getPulls(splitData) {
    return getDataAtIndex(splitData, pullsHeaderIndex);
  }
  function getPulledBy(splitData) {
    return getDataAtIndex(splitData, isPulledHeaderIndex);
  }
  function getCounterpart(splitData) {
    return getDataAtIndex(splitData, counterpartHeaderIndex);
  }
  function getCombo(splitData) {
    return getDataAtIndex(splitData, comboHeaderIndex);
  }
  function getMatching(splitData) {
    return getDataAtIndex(splitData, matchingHeaderIndex);
  }
  function getMatchingWeapon(splitData) {
    return getDataAtIndex(splitData, matchingWeaponHeaderIndex);
  }
  function getCanceledBy(splitData) {
    return getDataAtIndex(splitData, isCanceledByHeaderIndex);
  }
  function getCancels(splitData) {
    return getDataAtIndex(splitData, cancelsHeaderIndex);
  }
  function getAbbreviations(splitData) {
    return getDataAtIndex(splitData, abreviationHeaderIndex);
  }


  function getCardWithName(name, side, expansion, existingCards) {
    var simpleName = CDFService.getSimpleName(name);
    for (var i = 0; i < existingCards.length; i++) {
      var existingCard = existingCards[i];
      if ((existingCard.titleLowerNoSet === simpleName) &&
          (existingCard.side === side)) {

        // Looks like we have a match!  Let's make extra sure though...
        if (existingCard.set.toLowerCase().trim() === expansion.toLowerCase().trim()) {
          return existingCard;
        }

      }

    }
    return null;
  }


  function processHeaders(firstLine) {
    var headers = firstLine.split('|');
    idHeaderIndex = headers.indexOf('id');
    nameHeaderIndex = headers.indexOf('CardName');
    sideIndexHeader = headers.indexOf('Grouping');
    expansionIndexHeader = headers.indexOf('Expansion');
    pullsHeaderIndex = headers.indexOf('Pulls');
    isPulledHeaderIndex = headers.indexOf('IsPulled');
    counterpartHeaderIndex = headers.indexOf('Counterpart');
    comboHeaderIndex = headers.indexOf('Combo');
    matchingHeaderIndex = headers.indexOf('Matching');
    matchingWeaponHeaderIndex = headers.indexOf('MatchingWeapon');
    cancelsHeaderIndex = headers.indexOf('Cancels');
    isCanceledByHeaderIndex = headers.indexOf('IsCanceledBy');
    abreviationHeaderIndex = headers.indexOf('Abbreviation');
    uniquenessHeaderIndex = headers.indexOf("Uniqueness");
    lightSideIconsHeaderIndex = headers.indexOf("LightSideIcons");
    darkSideIconsHeaderIndex = headers.indexOf("DarkSideIcons");
    characteristicsHeaderIndex = headers.indexOf("Characteristics");
  }

  function addSwipDataFromSwipDump(data, existingCards) {
    var cards = [];

    // By lines
    var lines = data.split('\n');

    // Get the Headers first
    var firstLine = lines[0];
    processHeaders(firstLine);

    // Process each data line
    for(var line = 1; line < lines.length; line++){
      var cardLine = lines[line];
      cardLine = fixNewlines(cardLine);

      var cardDataFields = cardLine.split('|');
      var cardName = getCardName(cardDataFields);
      if (!cardName) {
        continue;
      }
      var cardWithoutSetInfo = CDFService.removeSetFromTitle(cardName);
      var cardSide = getSide(cardDataFields);
      var cardExpansion = getExpansion(cardDataFields);

      var existingCard = getCardWithName(cardWithoutSetInfo, cardSide, cardExpansion, existingCards);
      if (existingCard) {
        // Add the extra data from SWIP!!
        existingCard.id = getId(cardDataFields);
        existingCard.pulls = getPulls(cardDataFields);
        existingCard.pulledBy = getPulledBy(cardDataFields);
        existingCard.counterpart = getCounterpart(cardDataFields);
        existingCard.combo = getCombo(cardDataFields);
        existingCard.matching = getMatching(cardDataFields);
        existingCard.matchingWeapon = getMatchingWeapon(cardDataFields);
        existingCard.canceledBy = getCanceledBy(cardDataFields);
        existingCard.cancels = getCancels(cardDataFields);
        existingCard.abbreviation = getAbbreviations(cardDataFields);
        existingCard.characteristics = getCharacteristics(cardDataFields);
        existingCard.lightSideIcons = getLightSideIcons(cardDataFields);
        existingCard.darkSideIcons = getDarkSideIcons(cardDataFields);
        existingCard.uniqueness = getUniqueness(cardDataFields);
      } else {
        console.log("Failed to find card: " + cardWithoutSetInfo + " cardSide: "+ cardSide + " cardExpansion: " + cardExpansion);
      }

    }

    return cards;
  }
  this.addSwipDataFromSwipDump = addSwipDataFromSwipDump;

  function fixNewlines(line) {
    while (line.indexOf("\\par") !== -1) {
      line = line.replace("\\par", "<br>");
    }

    while (line.indexOf("\\b0") !== -1) {
      line = line.replace("\\b0", "<br>");
    }

    while (line.indexOf("\\b") !== -1) {
      line = line.replace("\\b", "<br>");
    }
    line = line.trim();
    return line;
  }

}]);
