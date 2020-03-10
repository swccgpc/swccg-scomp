"use strict";
var cardSearchApp = angular.module('cardSearchApp');
cardSearchApp.service('ExportService', ['$timeout', function($timeout) {

  // Export data into the following format

  // ORIGINAL DATA
  // var cardFormat = 'card "CARD_PATHS" "CARD_NAME (CARD_DESTINY)\nCARD_SIDE CARD_TYPE [CARD_RARITY]\nSet: CARD_SET\nPower: CARD_POWER Ability: CARD_ABILITY CARD_FORCE_SENSITIVITY Armor: CARD_ARMOR Hyperspeed: CARD_HYPERSPEED Maneuever: CARD_MANUEVER Landspeed: CARD_LANDSPEED\nDeploy: CARD_DEPLOY Forfeit: CARD_FORFEIT\nIcons: CARD_ICONS\n\nLore: CARD_LORE\n\nText: CARD_GAMETEXT CARD_LOCATION_GAMETEXT"';

  var cardFormat = 'card "CARD_PATHS" "CARD_NAME (CARD_DESTINY)\nCARD_SIDE CARD_TYPE [CARD_RARITY]\nSet: CARD_SET\nCARD_POWER_DATA CARD_ABILITY_DATA CARD_FORCE_SENSITIVITY CARD_ARMOR_DATA CARD_HYPERSPEED_DATA CARD_MANEUVER_DATA CARD_LANDSPEED_DATA\nCARD_DEPLOY_DATA CARD_FORFEIT_DATA\nCARD_ICONS_DATA\n\nCARD_LORE_DATA\n\nCARD_TEXT_DATA"';

  /*
  var cardFormat = 'card "CARD_PATHS" "CARD_NAME (CARD_DESTINY)\nCARD_SIDE CARD_TYPE [CARD_RARITY]\nSet: CARD_SET\nCARD_POWER_AND_STATS_DATA\nCARD_DEPLOY_AND_FORFEIT_DATA\nCARD_ICONS\n\nCARD_LORE_DATA\n\nCARD_TEXT_DATA"';

  var cardPower = "Power: CARD_POWER";
  var cardAbility = "Ability: CARD_ABILITY";
  var cardLandspeed = "Landspeed: CARD_LANDSPEED";
  var cardManuever = "Maneuver: CARD_MANEUVER";
  var cardArmor = "Armor: CARD_ARMOR";
  var cardDeploy = "Deploy: CARD_DEPLOY";
  var cardForfeit = "Forfeit: CARD_FORFEIT";
  var cardIcons = "Icons: CARD_ICONS";
  var cardLore = "Lore: CARD_LORE";
  var cardText = "Text: CARD_GAMETEXT CARD_LOCATION_GAMETEXT";
  */

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

        if (a.links[0] < b.links[0]) {
          return -1;
        } else if (a.links[0] > b.links[0]) {
          return 1;
        } else {
          return 0;
        }

        /*
        if (a.set < b.set) {
          return -1;
        } else if (a.set > b.set) {
          return 1;
        } else {
          return 0;
        }
        */

      }

    }
  }

  function addTypeSubtypes(cardList) {
    for (var i = 0; i < cardList.length; i++) {
      var card = cardList[i];
      var typeAndSubtype = card.type;
      if (card.subType) {
        typeAndSubtype += " - " + card.subType.trim();
      }
      card.typeAndSubtype = typeAndSubtype;
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

  function exportCdf(exportLight, exportDark, allCards) {
    addTypeSubtypes(allCards);

    var cardList = getCardsOfSide(exportLight, exportDark, allCards);

    // Sort by sub-type
    cardList = cardList.sort(cardSortFunc);

    var allCardData = "";

    if (exportLight) {
      allCardData += "version 20170717\n";
      allCardData += "back reb.gif";
    }
    if (exportDark) {
      allCardData += "version 20170717\n";
      allCardData += "back imp.gif";
    }


    var lastCardTypeSubtype = "";
    var firstSection = true;

    for (var i = 0; i < cardList.length; i++) {
      var card = cardList[i];

      var currentCardtypeAndSubtype = card.typeAndSubtype;

      // Sigh... CDFs bunch all of the "Creature - XXXXX" into "Creature"
      if (0 === currentCardtypeAndSubtype.indexOf("Creature")) {
        currentCardtypeAndSubtype = "Creature";
      }

      // Sigh... CDFs bunch all of the "Mission - XXXXX" into "Mission"
      if (-1 !== currentCardtypeAndSubtype.indexOf("ission")) {
        currentCardtypeAndSubtype = "Mission";
      }

      // Sigh... CDFs bunch all of the "Starship - Capital: XXXXX" into "Starship - Capital"
      if (-1 !== currentCardtypeAndSubtype.indexOf("Starship - Capital")) {
        currentCardtypeAndSubtype = "Starship - Capital";
      }

      // Sigh... CDFs bunch all of the "Starship - Starfighter:  XXXXX" into "Starship - Starfighter"
      if (-1 !== currentCardtypeAndSubtype.indexOf("Starship - Starfighter")) {
        currentCardtypeAndSubtype = "Starship - Starfighter";
      }

      // Sigh... CDFs bunch all of the "Starship - Squadron:  XXXXX" into "Starship - Squadron"
      if (-1 !== currentCardtypeAndSubtype.indexOf("Starship - Squadron")) {
        currentCardtypeAndSubtype = "Starship - Squadron";
      }

      // Sigh... CDFs bunch all of the "Vehicle - Combat:  XXXXX" into "Vehicle - Combat"
      if (-1 !== currentCardtypeAndSubtype.indexOf("Vehicle - Combat")) {
        currentCardtypeAndSubtype = "Vehicle - Combat";
      }

      // Sigh... CDFs bunch all of the "Vehicle - Creature:  XXXXX" into "Vehicle - Creature"
      if (-1 !== currentCardtypeAndSubtype.indexOf("Vehicle - Creature")) {
        currentCardtypeAndSubtype = "Vehicle - Creature";
      }

      // Sigh... CDFs bunch all of the "Vehicle - Shuttle:  XXXXX" into "Vehicle - Shuttle"
      if (-1 !== currentCardtypeAndSubtype.indexOf("Vehicle - Shuttle")) {
        currentCardtypeAndSubtype = "Vehicle - Shuttle";
      }

      // Sigh... CDFs bunch all of the "Vehicle - Transport:  XXXXX" into "Vehicle - Transport"
      if (-1 !== currentCardtypeAndSubtype.indexOf("Vehicle - Transport")) {
        currentCardtypeAndSubtype = "Vehicle - Transport";
      }



      if (lastCardTypeSubtype !== currentCardtypeAndSubtype) {
        // New card type!!!
        if (firstSection) {
          firstSection = false;
          allCardData += "\n\n";
        } else {
          allCardData += "\n\n\n";
        }
        allCardData += '[' + currentCardtypeAndSubtype + ']';
        allCardData += "\n";

        lastCardTypeSubtype = currentCardtypeAndSubtype;
      }

      var cardExport = exportCard(card);
      console.log(cardExport);

      allCardData = allCardData + "\n" + cardExport;
    }

    // Do some cleanup... Fix the 'unique' icons for cards. Not sure why these get messed up
    //allCardData = allCardData.replace(/Ä¢/g, 'ï');

    // Remove the "<br>" garbage for separating icons
    allCardData = allCardData.replace(/<br>/g, ',');

    // Save this data into a download...
    stringToDownload(allCardData);
  }
  this.exportCdf = exportCdf;


  function stringToDownload(str) {
    var text = str;
    var filename = "darksideExported.cdf";

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



  function initializeCardLine() {
    var cardFormat = 'card "CARD_PATHS" "CARD_NAME (CARD_DESTINY)\\nCARD_SIDE CARD_TYPE [CARD_RARITY]\\nSet: CARD_SET\\nCARD_POWER_AND_STATS_DATA\\nCARD_DEPLOY_AND_FORFEIT_DATA\\nCARD_ICONS\\n\\nCARD_LORE_DATA\\n\\nCARD_TEXT_DATA\\n\\nCARD_CONCEPT_BY\\n\\nCARD_ERRATA_INFO';
    return cardFormat;
  }

  function getCardLinkMinusCardPrefix(cardLink) {
    var noExtensionLink = cardLink.replace(/\.gif/g, "");
    if (cardLink.indexOf("/cards")) {
      return noExtensionLink.substr(5);
    }
    return noExtensionLink;

  }

  function buildCardPaths(card) {
    if (card.twoSided) {
      return "/TWOSIDED" + getCardLinkMinusCardPrefix(card.links[0]) + "/" + getFileFromPath(card.links[1]);
    }
    return getCardLinkMinusCardPrefix(card.links[0]);
  }

  function getFileFromPath(fullPath) {
    fullPath = fullPath.replace(/.*\//, "");
    fullPath = fullPath.replace(/\.gif/, "");
    return fullPath;
  }

  function buildCardNames(card) {
    return card.title;
  }

  function buildCardDestiny(card) {
    return card.destiny;
  }

  function buildCardLore(card) {
    var lore = "Lore: " + card.lore;
    lore = lore.trim();
    return lore;
  }

  function buildCardGametext(card) {
    if (card.type === 'Location') {
      return "Text: " + card.gametext;
    }
    return "Text: " + card.gametext;
  }

  function buildConceptBy(card) {
    if (card.conceptBy && card.conceptBy.trim() !== "") {
      return "\\n\\n" + card.conceptBy.trim();
    }
    return "";
  }

  function buildErrataInfo(card) {
    if (card.errataInfo && card.errataInfo.trim() !== "") {
      return "\\n\\n" + card.errataInfo.trim();
    }
    return "";
  }

  function buildPowerAndStatsData(card) {
    var powerAndStatsData = "";
    powerAndStatsData = appendFieldData(card, 'power', 'Power', powerAndStatsData);
    powerAndStatsData = appendFieldData(card, 'ability', 'Ability', powerAndStatsData);
    powerAndStatsData = appendFieldData(card, 'maneuver', 'Maneuver', powerAndStatsData);
    powerAndStatsData = appendFieldData(card, 'armor', 'Armor', powerAndStatsData);
    powerAndStatsData = appendFieldData(card, 'landspeed', 'Landspeed', powerAndStatsData);
    powerAndStatsData = appendFieldData(card, 'hyperspeed', 'Hyperspeed', powerAndStatsData);
    powerAndStatsData = appendFieldData(card, 'politics', 'Politics', powerAndStatsData);
    if (card.extraText && card.extraText.trim() !== "") {
      powerAndStatsData = powerAndStatsData.trim() + " " + card.extraText;
    }

    powerAndStatsData = appendEndlineIfValid(powerAndStatsData);
    return powerAndStatsData;
  }

  function buildDeployAndForfeitData(card) {
    var deployAndForfeitData = "";
    deployAndForfeitData = appendFieldData(card, 'deploy', 'Deploy', deployAndForfeitData);
    deployAndForfeitData = appendFieldData(card, 'forfeit', 'Forfeit', deployAndForfeitData);

    deployAndForfeitData = appendEndlineIfValid(deployAndForfeitData);
    return deployAndForfeitData;
  }

  function buildCardIcons(card) {
    var cardIcons = "";
    cardIcons = appendFieldData(card, 'icons', 'Icons', cardIcons);
    cardIcons = appendEndlineIfValid(cardIcons);
    return cardIcons;
  }

  function appendEndlineIfValid(currentString) {
    // Remove any trailing whitespace first
    currentString = currentString.trim();

    // If there is anything in this section, add a \n at the end
    // For example, if we had power/forfeit/etc
    var stringData = "" + currentString;
    if (stringData.trim() !== "") {
      currentString += "\\n";
    }
    return currentString;
  }

  function exportCard(card) {
    var cardLine = initializeCardLine();
    cardLine = cardLine.replace("CARD_PATHS", buildCardPaths(card));
    cardLine = cardLine.replace("CARD_NAME", buildCardNames(card));
    cardLine = cardLine.replace("CARD_DESTINY", buildCardDestiny(card));
    cardLine = cardLine.replace("CARD_SIDE", card.side);
    cardLine = cardLine.replace("CARD_TYPE", card.typeAndSubtype);
    cardLine = cardLine.replace("CARD_RARITY", card.rarity);
    cardLine = cardLine.replace("CARD_SET", card.set);
    cardLine = cardLine.replace("CARD_POWER_AND_STATS_DATA\\n", buildPowerAndStatsData(card));
    cardLine = cardLine.replace("CARD_DEPLOY_AND_FORFEIT_DATA\\n", buildDeployAndForfeitData(card));

    cardLine = cardLine.replace("CARD_ICONS\\n", buildCardIcons(card));
    cardLine = cardLine.replace("CARD_LORE_DATA", buildCardLore(card));
    cardLine = cardLine.replace("Lore:\\n\\n", ""); // Skip lore if empty
    cardLine = cardLine.replace("CARD_TEXT_DATA", buildCardGametext(card));

    cardLine = cardLine.replace("\\n\\nCARD_CONCEPT_BY", buildConceptBy(card));
    cardLine = cardLine.replace("\\n\\nCARD_ERRATA_INFO", buildErrataInfo(card));


    // Sigh... CDFs want a new line for each of the USED:, STARTING:, LOST:,
    cardLine = cardLine.replace("USED:", "\\nUSED:");
    cardLine = cardLine.replace("LOST:", "\\nLOST:");
    cardLine = cardLine.replace("STARTING:", "\\nSTARTING:");

    return cardLine;
  }
  this.exportCard = exportCard;


  function appendFieldData(card, fieldName, outputLabel, currentCardString) {
    var fieldData = getFieldData(card, fieldName);
    if (fieldData) {
      currentCardString += outputLabel + ": " + fieldData + " ";
    }
    return currentCardString;
  }


  function getFieldData(card, fieldName) {
    var fieldValue = card[fieldName];
    if (fieldValue) {
      var stringVal = "" + fieldValue;
      if (stringVal.trim() === "") {
        return null;
      }

      return fieldValue;
    }
    return null;
  }

  //var cardFormatTwoSided = 'card "/CARD_TWOSIDED_STRING/CARD_PATH" "CARD_NAMES (CARD_DESTINIES)\nCARD_SIDE CARD_TYPE [CARD_RARITY]\nSet: CARD_SET\nCARD_FRONT_TITLE:\n\nCARD_FRONT_GAMETEXT\n\nCARD_BACK_TITLE:\nCARD_BACK_GAMETEXT';

}]);

/*
[Characters]
card "/legacy/Virtual8-Light/t_aaylasecura" "�Aayla Secura (1)\nLight Character - Alien [R]\nSet: Virtual Block 8\nPower: 4 Ability: 6 Jedi Knight\nDeploy: 5 Forfeit: 7\nIcons: Warrior\n\nLore: Female Twi'lek. \n\nText: Power +1 for each of opponent's characters here. When with two of your aliens (or clones), adds one battle destiny. May not be targeted by weapons unless your other aliens (and clones) present are each 'hit.' Immune to You are Beaten and attrition <5."

[Admiral's Order]
card "/starwars/DeathStarII-Light/t_capitalsupport" "�Capital Support (6)\nLight Admiral's Order [R]\nSet: Death Star II\n\nText: Each pilot deploys -1 (or -2 if with an admiral) aboard a capital starship. Each capital starship with a pilot character aboard is immune to attrition < 4 (or adds 2 to immunity). During each of your control phases, opponent loses 1 Force for each battleground site your general controls that is related to a system you occupy."

[Defensive Shield]
card "/starwars/ReflectionsIII-Light/t_acloserace" "�A Close Race (0)\nLight Defensive Shield [PM]\nSet: Reflections III\nIcons: Episode I\n\nLore: 'Poodoo!'\n\nText: Plays on table. If you just lost a Podrace, your Force loss is limited to half the difference between the winning race total and your highest race total (round up). While you occupy three battlegrounds, Watto's Box is suspended."

[Device]
card "/starwars/JabbasPalace-Light/t_arcwelder" "Arc Welder (6)\nLight Device [U]\nSet: Jabba's Palace\n\nLore: Used primarily for sealing bulkheads and performing other repair functions. Especially innovative droids use it for other, less conventional purposes.\n\nText: Deploy on any R-unit droid. During your control phase, may use 2 Force to release an escorted captive present. Also, when present at start of a battle, may cause one opponent's character of ability = 1 present to be excluded from that battle."

[Effect]
card "/legacy/Virtual8-Light/t_agoodblasteratyourside" "�A Good Blaster At Your Side (3)\nLight Effect [U1]\nSet: Virtual Block 8\n\nLore: 'I've been looking forward to this for a long time.' 'Yes, I'll bet you have.' Han abruptly ended his conversation with Greedo and flipped Wuher a credit to pay for the cleanup.\n\nText: Deploy on table. Non-lightsaber weapons carried by your non-Jedi characters may not be stolen. During your control phase, opponent loses 1 Force for each battleground site

[Effect - Immediate]
card "/starwars/JabbasPalace-Light/t_agift" "�A Gift (4)\nLight Effect - Immediate [U]\nSet: Jabba's Palace\n\nLore: 'As a token of my good will, I present to you a gift: these two droids. Both are hardworking and will serve you well.'\n\nText: If you just moved a droid to Audience Chamber, deploy on the droid. Droid is an Undercover spy. Wherever opponent has an alien, opponent's battle destiny draws are -2 and Force drains are -1. Immediate Effect canceled if droid leaves Tatooine. (Immune to Control.)"

[Effect - Mobile]
card "/starwars/Hoth-Light/t_icestorm" "�Ice Storm (3)\nLight Effect - Mobile [U1]\nSet: Hoth\n\nLore: The intensity of a Hoth ice storm is exacerbated by its speed and erratic movement across the frozen planet.\n\nText: Deploy at outermost marker. All characters present at same exterior site are missing. Each turn, during your control phase, storm moves to next marker, reversing direction at innermost marker. Mobile Effect lost when moved beyond outermost marker."

[Effect - Political]
card "/starwars/Coruscant-Light/t_ascertainingthetruth" "�Ascertaining The Truth (3)\nLight Effect - Political [U]\nSet: Coruscant\nIcons: Episode I\n\nLore: 'We must move quickly to stop the Trade Federation.'\n\nText: Deploy on table. If no senator here, you may place a senator here from hand to subtract 3 from any battle destiny just drawn. If an order agenda here, during your move phase you may peek at top 2 cards of any Reserve Deck; replace in any order."

[Effect - Starting]
card "/starwars/ReflectionsIII-Light/t_anunusualamountoffear" "�An Unusual Amount Of Fear (0)\nLight Effect - Starting [PM]\nSet: Reflections III\nIcons: Episode I\n\nLore: The peacekeepers of the galaxy are not to be taken lightly.\n\nText: Before any starting cards are revealed, deploy on table with up to 10 cards from outside your deck face-down under here. Cards under here do not count toward your deck limit. Three times per game, may play a Defensive Shield from here, as if from hand."

[Effect - Utinni]
card "/starwars/Dagobah-Light/t_asteroidsdonotconcernme" "�Asteroids Do Not Concern Me (4)\nLight Effect - Utinni [R]\nSet: Dagobah\n\nLore: The personal fears of Vader's minions do not affect his priorities.\n\nText: Deploy on any asteroid sector. Target one opponent's capital starship. Pilots aboard target may not use ability to draw battle destiny. Subtract 4 from asteroid destiny when targeting that starship. Utinni Effect canceled when reached by target."

[Epic Event]
card "/starwars/ANewHope-Light/t_attackrun" "�Attack Run (0)\nLight Epic Event [R2]\nSet: A New Hope\n\nText:\nDeploy on Death Star: Trench.\nDuring your move phase, you may make an Attack Run as follows:\nEnter Trench: Move up to 3 of your starfighters into trench (for free). Dark Side may immediately follow with up to 3 TIEs (for free).\nProvide Cover: Identify your lead starfighter (Proton Torpedoes* required) and wingmen (if any). Turbolaser Batteries and TIEs with weapons may now target your starfighters (wingmen first, then lead if no wingmen remaining). Hit starfighters are immediately lost.\nIt's Away!: Draw two destiny.\nPull Up!: All starfighters now move to Death Star system (for free). If (total destiny + X + Y - Z) > 15, Death Star is 'blown away.'\nX = ability of lead pilot (or 3 if Targeting Computer aboard) just before Pull Up!.\nY = total sites at largest Rebel Base (Yavin 4 or Hoth).\nZ = highest ability of opponent's TIE pilots in trench just before Pull Up!.\n*Your Proton Torpedoes are immune to Overload."

[Interrupt - Lost]
card "/starwars/Tatooine-Light/t_ajedisresilience" "�A Jedi's Resilience (6)\nLight Interrupt - Lost [U]\nSet: Tatooine\n\nLore: Luke wasn't going to let Vader dispose of him too quickly.\n\nText: If you just lost a duel opponent initiated (before duel has any result) lose 1 Force to cancel the duel and return Interrupt (if any) used to initiate duel to owner's hand. OR If you just lost a character armed with a lightsaber, take that character into hand."

[Interrupt - Lost Or Starting]
[Interrupt - Starting]
[Interrupt - Used]
[Interrupt - Used Or Lost]
[Interrupt - Used Or Starting]

[Jedi Test]
card "/starwars/Dagobah-Light/t_ajedisstrength" "A Jedi's Strength (2)\nLight Jedi Test #2 [U]\nSet: Dagobah\n\nText: Deploy on an unoccupied Dagobah site. At the beginning of each of your move phases, opponent may relocate this Jedi Test to an adjacent site. Target a mentor on Dagobah and an apprentice who has completed Jedi Test #1. Apprentice may move only by using personal landspeed. Attempt when apprentice is present at the beginning of your control phase. Draw training destiny. If destiny + apprentice's ability > 13, test completed: Place on apprentice. Apprentice is power +1 and may move normally. Total ability of 6 or more is required for opponent to draw battle destiny."

[Location - Sector]
card "/starwars/Dagobah-Light/t_asteroidfield" "<><><>Asteroid Field (0)\nLight Location - Sector [C]\nSet: Dagobah\nIcons: Space\n\nText:\nLIGHT (1): 'Asteroid Rules' in effect here. If you control, may cancel Force drain at related system.\n\nDARK (1): 'Asteroid Rules' in effect here."

[Location - Site]
card "/starwars/Dagobah-Light/t_bigoneasteroidcaveorspaceslugbelly" "<>Big One: Asteroid Cave Or Space Slug Belly (0)\nLight Location - Site [U]\nSet: Dagobah\nIcons: Interior, Exterior, Cave, Planet\n\nText:\nLIGHT (1): 'Cave Rules' in effect here. If you control, may cancel Force drains at system Related to Big One.\n\nDARK (1): 'Cave Rules' in effect here."

[Objective]
card "/TWOSIDED/starwars/JabbasPalaceSealedDeck-Light/t_agentsinthecourt/nolovefortheempire" "Agents In The Court / No Love For The Empire (0/7)\nLight Objective [PM]\nSet: Jabba's Palace Sealed Deck\nAgents In The Court:\n\nDeploy Hutt Trade Route and a Jabba's Palace site. May deploy Yarna d'al' Gargan. Reveal one unique (�) alien from your deck whose lore specifies its species. This card is your Rep.\nFor remainder of game, your Rep is a leader. Yarna d'al' Gargan is immune to Alter. You may not deploy 'insert' cards or operatives. While a rancor is at Rancor Pit, Trap Door is immune to Bo Shuda.\n{Flip} this card if you occupy two battleground sites (must occupy a third with a non-unique alien of your Rep's species if a non-Tatooine location is on table).\n\nNo Love For The Empire:\n{While} this side up, once per turn you may cancel a Force drain or a just-drawn battle destiny by placing here from hand a copy of your Rep. Once during each of your control phases, you may retrieve a non-unique alien of your Rep's species. When two of your aliens are battling at any Tatooine location, add one destiny to total power. For remainder of game, your Rep may deploy from here as if from hand.\n{Flip} this card if you do not occupy 2 battleground sites."

[Podracer]
card "/starwars/Tatooine-Light/t_anakinspodracer" "�Anakin's Podracer (3)\nLight Podracer [R]\nSet: Tatooine\nIcons: Episode I\n\nLore: Built from Radon-Ulzer racing engines that Watto regarded as too burned-out to be of any use. New fuel injection subsystem created by Anakin radically increases thrust.\n\nText: Deploy on Podrace Arena. Draws 2 race destiny instead of 1. During your draw phase, if opponent has a higher race total than Anakin's Podracer, draw 3 race destiny next turn and choose 2. Once per game may take I Did It! into hand from Reserve Deck; reshuffle."

[Starship - Capital]
card "/legacy/Virtual9-Light/t_acclamatorclassassaultship" "Acclamator-Class Assault Ship (2)\nLight Starship - Capital: Assault Ship [C2]\nSet: Virtual Block 9\nPower: 6 Armor: 5 Hyperspeed: 4\nDeploy: 5 Forfeit: 6\nIcons: Permanent Pilot, Astromech, Clone Army, Republic\n\nLore: blank\n\nText: May add 4 pilots, 4 passengers, and 4 vehicles. Permanent pilot provides ability of 2. Adds 1 to attrition against opponent here for each piloted [Republic] starship present. Concussions Missiles may deploy aboard."

[Starship - Squadron]

card "/starwars/DeathStarII-Light/t_bwingattacksquadron" "B-wing Attack Squadron (3)\nLight Starship - Squadron: B-Wing [R]\nSet: Death Star II\nPower: 12 Maneuver: 2 Hyperspeed: 3\nDeploy: * Forfeit: 12\nIcons: Pilot x3, Nav Computer x3, Scomp Link x3\n\nLore: Utilizes dense formations on attack mission to concentrate firepower. This tactic is particulary effective in defeating deflector shields.\n\nText: * Replaces 3 B-Wings at one location (B-wings go to Used Pile). Permanent pilots provide total ability of 3. Each of its weapon destiny draws is +1."

[Starship - Starfighter]
card "/starwars/ThirdAnthology-Light/t_artoodetooinred5" "�Artoo-Detoo In Red 5 (0 or 7)\nLight Starship - Starfighter: X-Wing [PM]\nSet: Third Anthology\nPower: 3 Maneuver: 4 Hyperspeed: 5\nDeploy: 4 Forfeit: 5\nIcons: Nav Computer, Scomp Link\n\nLore: R2-D2 saved Luke and his starfighter more times than the young pilot could count.\n\nText: May add 1 pilot. Permanent astromech aboard is *R2-D2, who adds 2 to power, maneuver and hyperspeed. Luke of ability < 5 deploys free aboard. Immune to attrition < 5 when Luke piloting."

card "/TWOSIDED/starwars/Virtual4-Light/t_thefalconjunkyardgarbagefront/thefalconjunkyardgarbageback" "�The Falcon, Junkyard Garbage/�The Falcon, Junkyard Garbage (0/7)\nLight Starship - Starfighter: Heavily-Modified Light Freighter [C]\nSet: Virtual Set 4\nPower: 3 Maneuver: 4 Hyperspeed: 6\nDeploy: 0 Forfeit: 7\nIcons: Nav Computer, Resistance, Scomp Link, Episode VII\n\n�The Falcon, Junkyard Garbage\n\nLore: The Millennium Falcon's well-known reputation is favorable not only for its captain and first mate, but for the Alliance as well.\n\nText: May not be placed in Reserve Deck. If Falcon about to leave table, place it out of play. May add 2 pilots and 2 passengers. Has ship-docking capability. While [Episode VII] Han or Rey piloting, maneuver +2 and immune to attrition < 4 (< 6 if both). Once during your move phase, if at a site, may flip this card (even if unpiloted).\n\n�The Falcon, Junkyard Garbage\nLight Combat Vehicle - Heavily-Modified Light Freighter\nPower: 3 Maneuver: 5 Landspeed: 2\nDeploy: 0 Forfeit: 7\nIcons: Resistance, Scomp Link, Episode VII\n\nLore: Han's 'special modifications' for Millennium Falcon included security mechanisms, deflector shields, hull plating, faster hyperdrive and enhanced weapons. Enclosed.\n\nText: May not be placed in Reserve Deck. If Falcon about to leave table, place it out of play. May add 2 pilots and 2 passengers. Immune to Trample and Unsalvageable, even if unpiloted. While Finn or Rey aboard, immune to attrition < 4 (< 6 if both). Once during your move phase, if piloted, may flip this card."


[Vehicle - Combat]
card "/legacy/Virtual9-Light/t_atrt" "AT-RT (3)\nLight Vehicle - Combat: AT-RT [C]\nSet: Virtual Block 9\nPower: 3 Maneuver: 3 Landspeed: 3\nDeploy: 2 Forfeit: 3\nIcons: Clone Army, Permanent Pilot, Episode I\n\nLore: -\n\nText: May add 1 pilot (suspends permanent pilot). May move as a 'react.' Permanent pilot provides ability of 2. Dual Laser Cannon may deploy aboard. When deployed, may Dual Laser Cannon aboard from Reserve Deck; reshuffle."

[Vehicle - Creature]
card "/starwars/Tatooine-Light/t_eopie" "Eopie (5)\nLight Vehicle - Creature [C]\nSet: Tatooine\nPower: 1 Maneuver: 2 Landspeed: 2\nDeploy: 1 Forfeit: 3\nIcons: Episode I\n\nLore: Herd animal native to Tatooine. Adults are used as beasts of burden, while the young and elderly eopies are useful for consuming desert weeds.\n\nText: May add 2 'riders' (passengers). Ability = 1/4.Moves for free. While 'ridden' by Amidala in battle, adds one battle destiny."

[Vehicle - Shuttle]
card "/starwars/ANewHope-Light/t_incomt16skyhopper" "Incom T-16 Skyhopper (3)\nLight Vehicle - Shuttle [C2]\nSet: A New Hope\nPower: 1 Maneuver: 5 Landspeed: *\nDeploy: 2 Forfeit: 4\nIcons: Pilot\n\nLore: Enclosed vehicle used for shuttling and hot-rodding. E-16/x ion engine pushes T-16 up to 1200 kph.\n\nText: May add 1 passenger. Permanent pilot provides ability of 1. May move as a 'react.' * Landspeed = 4. OR 1 character may shuttle to or from same site for free."

[Vehicle - Transport]
card "/starwars/SpecialEdition-Light/t_air2racingswoop" "Air-2 Racing Swoop (5)\nLight Vehicle - Transport [C]\nSet: Special Edition\nPower: 0 Maneuver: 5 Landspeed: *\nDeploy: 2 Forfeit: 2\n\nLore: Features maneuvering flaps and repulsorlift engines. High speed and sensitive controls make swoops hard to drive. Outracing slavers on Bonadan, Han escaped on an Air-2.\n\nText: May add 1 driver and 1 passenger. *Landspeed = Driver's ability, and once per turn, may follow an opponent's vehicle or character that just moved from same site (if within range)."

[Weapon - Artillery]
card "/starwars/Hoth-Light/t_atgarlasercannon" "Atgar Laser Cannon (5)\nLight Weapon - Artillery [U2]\nSet: Hoth\nDeploy: 2 Forfeit: 2\n\nLore: Atgar 1.4 FD P-tower anti-vehicle cannon. Adapted to operate with minimal performance loss in the extremes of a cold environment.\n\nText: Deploy on an exterior planet site. Your warrior present may target a vehicle at same or adjacent site using 2 Force. Draw destiny. Target crashes if destiny +2 > armor. Target hit if destiny +1 > maneuver."

[Weapon - Automated]
card "/starwars/Endor-Light/t_explosivecharge" "Explosive Charge (4)\nLight Weapon - Automated [U]\nSet: Endor\n\nLore: Standard explosive charge carried by Rebel commandos. When used in multiple, these charges have the explosive capacity to level a heavily armored structure.\n\nText: Deploy on an interior site you occupy. Immune to Overload. Place in Used Pile if opponent controls this site. If you just lost a battle opponent initiated here, may draw destiny. All cards (except Effects) here are lost if destiny > 4 (otherwise, Charge lost)."

[Weapon - Character]
card "/starwars/Endor-Light/t_a280sharpshooterrifle" "��A280 Sharpshooter Rifle (3)\nLight Weapon - Character [R]\nSet: Endor\n\nLore: BlasTech sharpshooter rifle accurate to 500 meters. Corporal Janse brought several A280s with him when he left BlasTech.\n\nText: Use 2 Force to deploy on your scout warrior. May target a character, creature or vehicle at same or adjacent site for free. Draw destiny. Add 2 if warrior is alone and target is at an adjacent site. Target hit if total destiny > defense value."

[Weapon - Starship]
card "/starwars/DeathStarII-Light/t_awingcannon" "A-wing Cannon (4)\nLight Weapon - Starship [C]\nSet: Death Star II\n\nLore: Equipped with targeting sensor system. Weapon mounts pivot up to 60 degrees to improve targeting.\n\nText: Deploy on your A-Wing. May target a starfighter or squadron for free. Draw destiny. Add your starship's maneuver. Target hit if total destiny > twice target's defense value."

[Weapon - Vehicle]
card "/starwars/TheedPalace-Light/t_booma" "Booma (4)\nLight Weapon - Vehicle [C]\nSet: Theed Palace\nIcons: Episode I\n\nLore: Launched from fambaa-mounted catapults. Gungan 'energy balls' are used to disable a variety of mechanized threats. Effectiveness is enhanced by the skill of the user.\n\nText: Deploy on your Fambaa. Twice during battle may draw destiny. If destiny < total number of opponent's characters and vehicles present, one of them is lost (opponent's choice)."

*/
