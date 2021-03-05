'use strict';
var cardSearchApp = angular.module('cardSearchApp');
cardSearchApp.controller('CardSearchController', ['$scope', '$document', '$http', '$timeout', '$window', 'CDFService', 'ExportService', 'SWIPService',  function($scope, $document, $http, $timeout, $window, CDFService, ExportService, SWIPService) {

  var LOCAL_STORAGE_DATA_KEY = "scomp_data";

  var filterAddMode = {
    AND: "AND",
    OR: "OR",
    NOT: "NOT"
  };
  // Convert 'number' fields into strings  (power, etc)
  var numberFields = [
    "destiny",
    "power",
    "ability",
    "maneuver",
    "armor",
    "hyperspeed",
    "landspeed",
    "politics",
    "deploy",
    "forfeit"
  ];

  // This is the data that is currently being downloaded
  // We stage that data here first and then swap
  $scope.downloadedData = {
    cardList: [],
    sets: [],
    loadingLight: true,
    loadingDark: true,
    loadingSets: true,
    cardValueMap: null,
    cardFields: []
  };

  $scope.data = {
    matches: [],
    cardList: [], // From Dark.json & Light.json
    sets: [], // From sets.json
    loadingLight: true,
    loadingDark: true,
    loadingSets: true,
    performedSearch: false,
    noResultsFound: false,
    selectedCard: null,
    lastSelectedCard: null,
    showAdvancedSearch: false,
    imageLoadFailure: false,
    textOnly: false,
    showExtraData: true,
    cardValueMap: null,
    cardFields: [],
    advancedFieldSelect: {},
    advancedField: 'gametext',
    advancedOperator: 'contains',
    advancedValue: "",
    advancedConditions: [],
    operators: [
      { name: 'contains'},
      { name: "doesn't contain"},
      { name: '>' },
      { name: '<' },
      //{ name: '=' }, Gets confusing with multi-value fields, so just removing
      { name: '<=' },
      { name: '>=' },
      { name: 'not'}
    ],
    filterAddMode: filterAddMode.AND
  };

  function getCurrentSelectedCardIndex() {
    if ($scope.data.lastSelectedCard !== null) {
      for (var i = 0; i < $scope.data.matches.length; i++) {
        var card = $scope.data.matches[i];
        if (card === $scope.data.lastSelectedCard) {
          return i;
        }
      }
    }
    return -1;
  }
  function moveDown() {
    var selectedCardIndex = getCurrentSelectedCardIndex();
    if (selectedCardIndex !== -1) {
      selectCardAtIndex(selectedCardIndex+1);
    }
  }
  function moveUp() {
    var selectedCardIndex = getCurrentSelectedCardIndex();
    if (selectedCardIndex !== -1) {
      selectCardAtIndex(selectedCardIndex-1);
    }
  }
  function selectCardAtIndex(index) {
    var indexToSelect = index;
    if (index < 0) {
      indexToSelect = 0;
    } else if (index >= $scope.data.matches.length) {
      indexToSelect = $scope.data.matches.length - 1;
    }
    $scope.selectCard($scope.data.matches[indexToSelect]);
    $scope.$apply();
  }

  $scope.selectCard = function(card, $event) {
    $scope.data.lastSelectedCard = card;
    $scope.data.selectedCard = card;
    $scope.data.imageLoadFailure = false;

    if ($event) {
      $event.stopPropagation();
    }
  };

  $scope.clickedCardData = function($event) {
    $event.stopPropagation();
  };


  function registerKeyEvents() {
    jQuery($document).keydown(function(event) {
      if (event.which === 38) {
        moveUp();
        event.preventDefault();
        event.stopPropagation();
      } else if (event.which === 40) {
        moveDown();
        event.preventDefault();
        event.stopPropagation();
      }
    });
  }


  // Transform the set of advanced filters into a nice string
  function conditionToString(condition) {
    var conditionString = "";
    if (condition.group) {
      for (var i = 0; i < condition.group.rules.length; i++) {
        var rule = condition.group.rules[i];
        if (conditionString !== "") {
          conditionString += " OR " + conditionToString(rule);
        } else {
          conditionString += rule.field + " " + rule.condition + " " + rule.data;
        }
      }
    }
    if (condition.isExcludeCondition) {
      conditionString = "NOT (" + conditionString + ")";
    }
    return conditionString;
  }
  $scope.conditionToString = conditionToString;

  $scope.selectCondition = function(condition) {
    for (var i = 0; i < $scope.data.advancedConditions.length; i++) {
      var cond = $scope.data.advancedConditions[i];
      cond.selected = false;
    }
    condition.selected = true;
  };

  $scope.updateAdvancedSearchText = function($event, $select) {
    $scope.data.advancedValue = $select.search;

    if ($event.keyCode === 13) {
      $scope.addAdvancedCondition($select);
      $select.search = "";
    }
  };


  $scope.addAdvancedCondition = function($select) {
    var textSearch = $scope.data.advancedValue;
    var operator = $scope.data.advancedOperator;
    var fieldName = $scope.data.advancedField;
    var condition = buildRule(fieldName, textSearch, operator);

    // If no search text, don't do anything
    if (!textSearch || textSearch.trim() === "") {
      return;
    }

    var addToEnd = true;
    if ($scope.data.filterAddMode === filterAddMode.OR) {
      // Append this to the last condition (if one exists). Otherwise
      // just add it to the end
      var conditionCount = $scope.data.advancedConditions.length;
      if (conditionCount > 0) {
        var lastCondition = $scope.data.advancedConditions[conditionCount - 1];
        lastCondition.group.rules.push(condition);
        addToEnd = false;
      }
    } else if ($scope.data.filterAddMode === filterAddMode.NOT) {
      condition.isExcludeCondition = true;
    }

    if (addToEnd) {
      $scope.data.advancedConditions.push(condition);
    }

    $scope.data.advancedValue = "";
    $select.search = "";

    doSearch();
  };

  $scope.removeCondition = function() {
    for (var i = 0; i < $scope.data.advancedConditions.length; i++) {
      var condition = $scope.data.advancedConditions[i];
      if (condition.selected) {
        $scope.data.advancedConditions.splice(i, 1);
        break;
      }
    }
    doSearch();
  };

  $scope.clearFilter = function() {
    $scope.data.advancedConditions = [];
    $scope.data.advancedField = "gametext";
    $scope.data.advancedOperator = "contains";
    doSearch();
  };


  function buildRule(fieldName, text, operator) {
    var condition = {
      group: {
        operator: 'OR',
        rules: [
          {
            condition: operator,
            field: fieldName,
            data: text
          }
        ]
      }
    };
    return condition;

  }


  /**
   * This is the basic structure of filters. They can be
   * either a 'group' (in which case it has sub-rules) or a 'condition'
   * in which case it matches a given field with given data
   *
  $scope.filter = {
    group: {
      operator: 'AND',
      rules: [
        {
          condition: 'contains',
          field: 'gametext',
          data: ''
        },
        {
          condition: 'contains',
          field: 'gametext',
          data: ''
        }
      ]
    }
  };
  */


  $scope.search = {
    side: "ALL",
    type: "ALL",
    searchField: "TITLE",
    text: ""
  };

  $scope.done = function() {
    alert("done!");
  };

  $scope.advancedSearchBuilder = function() {
    $scope.data.showAdvancedSearch = true;
  };



  /**
   * Build up a list of all requirements from the left-hand pane
   * Store them as an array of requirements in the filter-format
   */
  function getBasicAndSearches() {

    var andSearches = [];

    /*
    group: {
      operator: 'AND',
      rules: [
        {
          condition: 'contains',
          field: 'gametext',
          data: ''
        },
        {
          condition: 'contains',
          field: 'gametext',
          data: ''
        }
      ]
    }
    */

    var searchText = $scope.search.text.toLowerCase().trim();

    // Specific Search Fields
    if (searchText !== "" && $scope.search.searchField === "ALL") {
      andSearches.push({
        group: {
          operator: 'OR',
          rules: [
            {
              condition: 'contains',
              field: 'gametext',
              data: searchText
            },
            {
              condition: 'contains',
              field: 'lore',
              data: searchText
            },
            {
              condition: 'contains',
              field: 'title',
              data: searchText
            },

          ]
        }
      });
    }
    if (searchText !== "" && $scope.search.searchField === "GAMETEXT") {
      andSearches.push({
        condition: 'contains',
        field: 'gametext',
        data: searchText
      });
    }
    if (searchText !== "" && $scope.search.searchField === "LORE") {
      andSearches.push({
        condition: 'contains',
        field: 'lore',
        data: searchText
      });
    }
    if (searchText !== "" && $scope.search.searchField === "TITLE") {
      andSearches.push({
        condition: 'contains',
        field: 'title',
        data: searchText
      });
    }


    if ($scope.search.type !== "ALL") {
      var requiredType = CDFService.getTypeSearchStringFromType($scope.search.type);
      andSearches.push({
        condition: 'contains',
        field: 'type',
        data: requiredType
      });
    }

    if ($scope.search.side === "LIGHT") {
      andSearches.push({
        condition: 'contains',
        field: 'side',
        data: "Light"
      });
    }
    if ($scope.search.side === "DARK") {
      andSearches.push({
        condition: 'contains',
        field: 'side',
        data: "Dark"
      });
    }

    return andSearches;
  }


  /*
   * Build the search parameters based on the left-hand panel
   * and optionally advanced settings!
   */
  function buildCumulativeSearch() {

    var basicSearches = getBasicAndSearches();
    var cumulativeSearch = {
      group: {
        operator: "AND",
        rules: basicSearches
      }
    };

    for (var i = 0; i < $scope.data.advancedConditions.length; i++) {
      var condition = $scope.data.advancedConditions[i];
      if (!condition.isExcludeCondition) {
        cumulativeSearch.group.rules.push(condition);
      }
    }

    // If no search criteria, just return an empty search
    if (basicSearches.length < 1 && $scope.data.advancedConditions.length < 1) {
      return null;
    }

    return cumulativeSearch;
  }

  /*
   * Build a query which shows which cards to NOT include
   */
  function buildSearchToExclude() {
    var excludeSearch = {
      group: {
        operator: "OR",
        rules: []
      }
    };

    for (var i = 0; i < $scope.data.advancedConditions.length; i++) {
      var condition = $scope.data.advancedConditions[i];
      if (condition.isExcludeCondition) {
        excludeSearch.group.rules.push(condition);
      }
    }

    return excludeSearch;
  }

  $scope.swallowClick = function($event) {
    $event.stopPropagation();
  };

  $scope.cancelAdvanced = function() {
    $scope.data.showAdvancedSearch = false;
  };

  $scope.hideCardData = function() {
    $scope.data.selectedCard = null;
  };

  $scope.toggleExtraData = function() {
    $scope.data.showExtraData = !$scope.data.showExtraData;
  };

  // Load cached data if available!
  loadCachedData();

  $http.get('Light.json').success(function(data) {
    addCardsFromJson(data);
    $scope.downloadedData.loadingLight = false;

    massageData();
  }).error(function(err) {
    console.error("Data load failure. Defaulting to text-only");
    $scope.data.textOnly = true;
  });

  $http.get('Dark.json').success(function(data) {
    addCardsFromJson(data);
    $scope.downloadedData.loadingDark = false;

    massageData();
  }).error(function(err) {
    console.error("Data load failure. Defaulting to text-only");
    $scope.data.textOnly = true;
  });

  $http.get('sets.json').success(function(setsData) {
    $scope.downloadedData.sets = setsData;
    $scope.downloadedData.loadingSets = false;

    massageData();
  }).error(function(err) {
    console.error("Data load failure. Defaulting to text-only");
    $scope.data.textOnly = true;
  });



  /**
   * Massage the data so that it can be searched and utilized easier
   */
  function massageData() {
    flattenCardData($scope.downloadedData);
    loadSearchData($scope.downloadedData);

    // For small screens (probably mobile), hide the extra data by default
    var w = angular.element($window);
    if (w.width() < 800) {
      $scope.data.showExtraData = false;
    }

    // Once we have all of the real data loaded. Move it into the active data!
    if (!$scope.downloadedData.loadingLight &&
        !$scope.downloadedData.loadingDark &&
        !$scope.downloadedData.loadingSets)
    {
      swapActiveDataWithLoadedData($scope.downloadedData);
    }
  }

  function swapActiveDataWithLoadedData(downloadedData) {
    $scope.data.cardList = downloadedData.cardList;
    $scope.data.sets = downloadedData.sets;
    $scope.data.loadingLight = downloadedData.loadingLight;
    $scope.data.loadingDark = downloadedData.loadingDark;
    $scope.data.loadingSets = downloadedData.loadingSets;
    $scope.data.cardValueMap = downloadedData.cardValueMap;
    $scope.data.cardFields = downloadedData.cardFields;

    try {
      // Store the loaded data into LocalStorage for fast loading later
      // Note: This is approaching 3.8 MB. If we exceed 5MB, this will start failing
      localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify($scope.data));
    }
    catch(ex) {
      console.error("Error saving data into LocalStorage. Cache will not be availalbe");
    }
    
  }

  function loadCachedData() {
    try {
      var cachedDataString = localStorage.getItem(LOCAL_STORAGE_DATA_KEY);
      if (cachedDataString) {
        var cachedData = JSON.parse(cachedDataString);

        $scope.data.cardList = cachedData.cardList;
        $scope.data.sets = cachedData.sets;
        $scope.data.loadingLight = cachedData.loadingLight;
        $scope.data.loadingDark = cachedData.loadingDark;
        $scope.data.loadingSets = cachedData.loadingSets;
        $scope.data.cardValueMap = cachedData.cardValueMap;
        $scope.data.cardFields = cachedData.cardFields;
      }
    }
    catch(ex) {
      console.error("Error loading data from LocalStorage.");
    }
  }

  function setNameFromSetId(setId, setNameMapping) {
    if (setNameMapping[setId]) {
      return setNameMapping[setId];
    }
    return setId;
  }

  /**
   * We want the card data in a flat data structure so we can
   * search it really easily
   */
  function flattenCardData(data) {

    var setNameMapping = {};
    data.sets.forEach(function(set) {
      setNameMapping[set.id] = set.name;
    });

    for (var i = 0; i < data.cardList.length; i++) {
      var card = data.cardList[i];
      card.titleSortable = CDFService.getSimpleName(card.front.title);
      card.set = setNameFromSetId(card.set, setNameMapping);
      card.setAbbreviation = CDFService.getSetAbbreviation(card.set);
      card.links = [card.front.imageUrl];
      if (card.back && card.back.imageUrl) {
        card.links.push(card.back.imageUrl);
      }
      card.links_large = card.links;
      if (card.links_large.length > 0) {
        card.links_large[0] = card.links_large[0].replace("?raw=true", "");
      }
      if (card.links_large.length > 1) {
        card.links_large[1] = card.links_large[1].replace("?raw=true", "");
      }

      addCardDataToFrontBack(card, card.front);
      addCardDataToFrontBack(card, card.back);

      convertNumberDataFromStrings(card.front);
      convertNumberDataFromStrings(card.back);
    }

    console.log("Added titles for card count: " + $scope.data.cardList.length);
  }

  /*
   * In the DB, many of our fields are stored as strings (power, etc)
   * due to needing to support '*' and multi-value cards. For Scomp link, just
   * convert these string values into numbers, which works for all of our purposes
   */
  function convertNumberDataFromStrings(cardFrontOrBack){
    if (cardFrontOrBack) {
      numberFields.forEach((fieldName) => {
        if (cardFrontOrBack[fieldName]) {
          var value = parseFloat(cardFrontOrBack[fieldName]);
          if (value) {
            cardFrontOrBack[fieldName] = value;
          }
        }
      });
    }
  }


  /**
   * Add the shared 'card' data to the 'front' or 'back' side of the card
   */
  function addCardDataToFrontBack(card, cardSide) {
    if (!cardSide) {
      return;
    }

    cardSide.id = card.id;
    cardSide.side = card.side;
    cardSide.rarity = card.rarity;
    cardSide.set = card.set;
    cardSide.conceptBy = card.conceptBy;
    cardSide.pulls = card.pulls;
    cardSide.pulledBy = card.pulledBy;
    cardSide.counterpart = card.counterpart;
    cardSide.combo = card.combo;
    cardSide.matching = card.matching;
    cardSide.matchingWeapon = card.matchingWeapon;
    cardSide.canceledBy = card.canceledBy;
    cardSide.cancels = card.cancels;
    cardSide.abbreviation = card.abbreviation;
    cardSide.titleSortable = getSimpleName(card.front.title);
    cardSide.setAbbreviation = getSetAbbreviation(card.set);

    // If we are missing an array completely, just stick an empty one in it's place
    if (!cardSide.icons) {
      cardSide.icons = [];
    }
  }

  function addCardsFromJson(cardData) {
    var cards = cardData.cards;
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];

      // Skip legacy cards!
      if (card.legacy) {
        continue;
      }

      // Trim some data to save space
      delete card.id;
      delete card.gempId;
      delete card.printings;
      delete card.legacy;

      $scope.downloadedData.cardList.push(card);
    }
  }


  /**
   * Build a list of all of the card fields
   */
  function loadSearchData(data) {
    data.cardValueMap = CDFService.getCardValueMap(data.cardList);
    data.cardFields = [];
    for (var fieldName in data.cardValueMap) { //jshint ignore:line
      data.cardFields.push(fieldName);
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


  $scope.searchIfNotEmpty = function() {
    if ($scope.search.text.trim() !== "") {
      $scope.doSearch();
    }
  };


  /**
   * Compare the given field, returning true on match and false otherwise
   */
  function compareFields(card, fieldName, compareType, value) {

    return compareFieldsToCardSide(card.front, fieldName, compareType, value) ||
           compareFieldsToCardSide(card.back, fieldName, compareType, value);
  }

  function compareFieldsToCardSide(card, fieldName, compareType, value) {
    if (!card || typeof card[fieldName] === 'undefined' || card[fieldName] === null) {
      return false;
    }

    /*
    { name: '=' },
    { name: '<' },
    { name: '<=' },
    { name: '>' },
    { name: '>=' },
    { name: 'contains'},
    { name: 'not'},
    { name: "doesn't contain"}
    */

    var valueToCompare = value;
    var cardField = "";

    // If the card data is of type number, then compare using numbers
    // If the card data is of type string, then do string compares
    if (typeof card[fieldName] === 'string')
    {
      cardField = card[fieldName].toLowerCase();
      valueToCompare = value.toLowerCase();
    }
    else if (typeof card[fieldName] === 'number')
    {
      cardField = parseFloat(card[fieldName]);
      valueToCompare = parseFloat(value);
    }
    else if (Array.isArray(card[fieldName]))
    {
      // Add all string values from the array
      cardField = "";
      card[fieldName].forEach(function(txt) {
        cardField += " " + txt.toLowerCase();
      });
      valueToCompare = value.toLowerCase();
    }

    // For "contains", treat them all as strings
    if ((compareType === "contains") || (compareType === "doesn't contain"))
    {
      cardField = ("" + card[fieldName]).toLowerCase();
      valueToCompare = value.toLowerCase();
    }

    if (compareType === '=') {
      return cardField == valueToCompare; //jshint ignore:line
    } else if (compareType === 'not') {
      return cardField != valueToCompare; //jshint ignore:line
    } else if (compareType === '<') {
      return cardField < valueToCompare; //jshint ignore:line
    } else if (compareType === '<=') {
      return cardField <= valueToCompare; //jshint ignore:line
    } else if (compareType === '>') {
      return cardField > valueToCompare; //jshint ignore:line
    } else if (compareType === '>=') {
      return cardField >= valueToCompare; //jshint ignore:line
    } else if (compareType === 'contains') {
      return -1 !== cardField.indexOf(valueToCompare); //jshint ignore:line
    } else if (compareType === "doesn't contain") {
      return -1 === cardField.indexOf(valueToCompare); //jshint ignore:line
    } else {
      console.error("Unknown compare type: " + compareType);
      return false;
    }

  }


  /**
   * Get a list of all cards that exist in either list #1 or list #2
   */
  function getCardsInAnyList(list1, list2) {
    var cumulativeCards = [];

    var i = 0;
    var card = null;

    for (i = 0; i < list1.length; i++) {
      card = list1[i];
      addCardToList(card, cumulativeCards);
    }

    for (i = 0; i < list2.length; i++) {
      card = list2[i];
      addCardToList(card, cumulativeCards);
    }

    return cumulativeCards;
  }


  /**
   * Adds a card to the given list
   */
  function addCardToList(card, list) {
    var alreadyExists = false;
    for (var j = 0; j < list.length; j++) {
      var existingCard = list[j];
      if (0 === compareCards(existingCard, card)) {
        alreadyExists = true;
        break;
      }
    }

    if (!alreadyExists) {
      list.push(card);
    }
  }


  /**
   * Find all cards that exist in both list #1 and list #2
   */
  function getCardsInBothLists(list1, list2) {
    var cardsInBothLists = [];
    for (var i = 0; i < list1.length; i++) {
      var card1 = list1[i];

      for (var j = 0; j < list2.length; j++) {
        var card2 = list2[j];
        if (!card2 || !card1) {
          console.log("error: bad card????");
        }

        if (0 === compareCards(card1, card2)) {
          cardsInBothLists.push(card2);
          break;
        }
      }
    }
    return cardsInBothLists;
  }


  /**
   * Match cards based on a given rule
   */
  function getCardsMatchingSimpleRule(rule) {

    var matches = [];
    for (var i = 0; i < $scope.data.cardList.length; i++) {
      var card = $scope.data.cardList[i];
      if (card.legacy) {
        continue;
      }

      // Empty field. Just ignore it!
      if (rule.data === "") {
        matches.push(card);
        continue;
      }

      if (compareFields(card, rule.field, rule.condition, rule.data)) {
        matches.push(card);
      }
    }
    return matches;
  }


  /**
   * Match cards based on a group of data
   */
  function getCardsMatchingRuleGroup(group) {
    // Evaluate the group of rules using AND or OR
    var firstRule = true;
    var cumulativeCardsMatchingRules = [];

    for (var i = 0; i < group.rules.length; i++) {
      var subRule = group.rules[i];
      var cardsMatchingRule = getCardsMatchingRule(subRule);

      if (group.operator === "AND") {
        if (firstRule) {
          cumulativeCardsMatchingRules = cardsMatchingRule;
          firstRule = false;
        }
        cumulativeCardsMatchingRules = getCardsInBothLists(cumulativeCardsMatchingRules, cardsMatchingRule);
      } else if (group.operator === "OR") {
        cumulativeCardsMatchingRules = getCardsInAnyList(cumulativeCardsMatchingRules, cardsMatchingRule);
      }
    }

    return cumulativeCardsMatchingRules;
  }


  function removeCardsFromList(cardList, cardsToExclude) {
    var filteredList = [];

    for (var i = 0; i < cardList.length; i++) {
      var card = cardList[i];
      var exclude = false;

      for (var j = 0; j < cardsToExclude.length; j++) {
        var excludedCard = cardsToExclude[j];
        if (card === excludedCard) {
          exclude = true;
          break;
        }
      }

      if (!exclude) {
        filteredList.push(card);
      }
    }

    return filteredList;
  }



  /**
   * Get cards that match a given rule (may be complex or simple)
   */
  function getCardsMatchingRule(rule) {

    if (rule.condition) {

      // This is a specific condition, not another rule
      return getCardsMatchingSimpleRule(rule);

    } else if (rule.group) {

      return getCardsMatchingRuleGroup(rule.group);
    }
  }

  function clearSearch() {
    $scope.search.side = "ALL";
    $scope.search.type = "ALL";
    $scope.search.searchField = "TITLE";
    $scope.search.text = "";
    doSearch();
  }
  $scope.clearSearch = clearSearch;

  /**
   * Perform a search
   */
  function doSearch() {
    var cumulativeSearch = buildCumulativeSearch();
    var searchToExclude = buildSearchToExclude();

    performSearchAndDisplayResults(cumulativeSearch, searchToExclude);
  }
  $scope.doSearch = doSearch;

  function compareCards(a, b) {
    if(a.titleSortable < b.titleSortable) {
      return -1;
    }
    if(a.titleSortable > b.titleSortable) {
      return 1;
    }
    if(a.type < b.type) {
      return -1;
    }
    if(a.type > b.type) {
      return 1;
    }
    if(a.subType < b.subType) {
      return -1;
    }
    if(a.subType > b.subType) {
      return 1;
    }
    if(a.side < b.side) {
      return -1;
    }
    if(a.side > b.side) {
      return 1;
    }
    if(a.set < b.set) {
      return -1;
    }
    if(a.set > b.set) {
      return 1;
    }

    return 0;
  }

  function sortByName(a, b){
    return compareCards(a, b);
  }


  /**
   * Perform the given search and update the search results pane
   */
  function performSearchAndDisplayResults(searchCriteria, excludeCriteria) {
    $scope.data.selectedCard = null;
    $scope.data.lastSelectedCard = null;
    $scope.data.noResultsFound = false;
    $scope.data.performedSearch = true;
    $scope.data.matches = [];

    if (!searchCriteria) {
      $scope.data.performedSearch = false;
      return;
    }

    var matchingCards = getCardsMatchingRule(searchCriteria);
    var excludeCards = getCardsMatchingRule(excludeCriteria);

    matchingCards = removeCardsFromList(matchingCards, excludeCards);

    $scope.data.matches = matchingCards;

    if ($scope.data.matches.length === 0) {
      $scope.data.noResultsFound = true;
    } else {
      $scope.data.noResultsFound = false;
    }

    $scope.data.matches.sort(sortByName);
    $scope.data.showAdvancedSearch = false;
  }


  $scope.onImageLoadError = function() {
    console.error("Error loading image!");
    $scope.data.imageLoadFailure = true;
  };

  $scope.onImageLoadSuccess = function() {
    console.log("Image Loaded");
    $scope.data.imageLoadFailure = false;
  };

  $scope.swallow = function($event) {
    $event.stopPropagation();
  };

  $scope.hasExtraData = function(card) {
    return  card.pulls ||
            card.pulledBy ||
            card.counterpart ||
            card.combo ||
            card.matching ||
            card.matchingWeapon ||
            card.canceledBy ||
            card.cancels ||
            card.abbreviation;
  };



  // Listen for events on load
  setTimeout(registerKeyEvents, 1500);

}]);
