const ILLEGAL_CHARACTERS = new Array(
  ".", ",", ":", ";", "!", "?", "@", "$", "%", "<", ">", "(", ")", "[", "]", "{", "}", "~", "^",
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"
);

const STOPWORDS = new Array(
    "goals", "goal", "tasks", "task", "Ziel", "Aufgabe",
    "a", "about", "above", "above", "across", "after",
    "afterwards", "again", "against", "all", "almost", "alone", "along",
    "already", "also","although","always","am","among", "amongst",
    "amoungst", "amount",  "an", "and", "another", "any","anyhow","anyone",
    "anything","anyway", "anywhere", "are", "around", "as",  "at", "back",
    "be","became", "because","become","becomes", "becoming", "been",
    "before", "beforehand", "behind", "being", "below", "beside",
    "besides", "between", "beyond", "bill", "both", "bottom","but",
    "by", "call", "can", "cannot", "cant", "co", "con", "could",
    "couldnt", "cry", "de", "describe", "detail",  "do", "does", "done",  "down",
    "due", "during", "each", "eg", "eight", "either", "eleven","else",
    "elsewhere", "empty", "enough", "etc", "even", "ever", "every",
    "everyone", "everything", "everywhere", "except", "few", "fifteen",
    "fify", "fill", "find", "fire", "first", "five", "for", "former",
    "formerly", "forty", "found", "four", "from", "front", "full",
    "further", "get", "give", "go", "had", "has", "hasnt", "have",
    "he", "hence", "her", "here", "hereafter", "hereby", "herein",
    "hereupon", "hers", "herself", "him", "himself", "his", "how",
    "however", "hundred", "ie", "if", "in", "inc", "indeed",
    "interest", "into", "is",  "it", "its", "itself", "keep",
    "last", "latter", "latterly", "least", "less", "ltd", "made",
    "many", "may", "me", "meanwhile", "might", "mill", "mine",
    "more", "moreover", "most", "mostly", "move", "much", "must", "my",
    "myself", "name", "namely", "neither", "never", "nevertheless", "next",
    "nine", "no", "nobody", "none", "noone", "nor", "not", "nothing", "now",
    "nowhere", "of", "off", "often", "on", "once", "one", "only", "onto",
    "or", "other", "others", "otherwise", "our", "ours", "ourselves", "out",
    "over", "own","part", "per", "perhaps", "please", "put", "rather", "re",
    "same", "see", "seem", "seemed", "seeming", "seems", "serious", "several",
    "she", "should", "show", "side", "since", "sincere", "six", "sixty", "so",
    "some", "somehow", "someone", "something", "sometime", "sometimes", "somewhere",
    "still", "such", "system", "take", "ten", "than", "that", "the", "their", "them",
    "themselves", "then", "thence", "there", "thereafter", "thereby", "therefore",
    "therein", "thereupon", "these", "they", "thickv", "thin", "third", "this",
    "those", "though", "three", "through", "throughout", "thru", "thus", "to",
    "together", "too", "top", "toward", "towards", "twelve", "twenty", "two",
    "un", "under", "until", "up", "upon", "us", "very", "via", "was", "way", "we",
    "well", "were", "what", "whatever", "when", "whence", "whenever", "where",
    "whereafter", "whereas", "whereby", "wherein", "whereupon", "wherever",
    "whether", "which", "while", "whither", "who", "whoever", "whole", "whom",
    "whose", "why", "will", "with", "within", "without", "would", "yet", "you",
    "your", "yours", "yourself", "yourselves", "the",
    "und", "oder", "in", "der", "die", "das", "den", "dem", "du", "sie", "ich", "auf", "bis", "nach");

const GOOGLE_URL_PATTERN = /((http|https):\/\/www\.google\.(de|com)(\/(.*))?)/;
const GOOGLE_SCHOLAR_URL_PATTERN = /((http|https):\/\/scholar\.google\.(de|com)(\/(.*))?)/;
const BING_URL_PATTERN = /((http|https):\/\/www\.bing\.(de|com)(\/(.*))?)/;
const YAHOO_URL_PATTERN = /((http|https):\/\/(.*)?\.search.yahoo\.com(\/(.*))?)/;
const WIKIPEDIA_URL_PATTERN = /((http|https):\/\/((www|de)\.)?wikipedia\.(de|org|com)(\/(.*))?)/;
const SOWIPORT_URL_PATTERN = /((http|https):\/\/sowiport\.gesis\.org(\/(.*))?)/;
const YOUTUBE_PATTERN = /((http|https):\/\/www\.youtube\.com(\/(.*))?)/;
const MS_ACADEMIC_PATTERN = /((http|https):\/\/academic\.research\.microsoft\.com(\/(.*))?)/;

const GOOGLE_SEARCHURL = "https://www.google.com/search?q=";
const GOOGLE_SCHOLAR_SEARCHURL = "https://scholar.google.com/scholar?q=";
const BING_SEARCHURL = "http://www.bing.com/search?q=";
const YAHOO_SEARCHURL = "https://search.yahoo.com/search?p=";
const WIKIPEDIA_SEARCHURL = "https://en.wikipedia.org/wiki/Special:Search/";
const SOWIPORT_SEARCHURL = "http://sowiport.gesis.org/Search/Results?type=AllFields&lookfor=";
const YOUTUBE_SEARCHURL = "https://www.youtube.com/results?search_query=";
const MS_ACADEMIC_SEARCHURL = "http://academic.research.microsoft.com/Search?query=";

const GOOGLE_SUGGESTIONS_URL = "http://www.google.com/complete/search?output=firefox&q="; // http://suggestqueries.google.com/complete/search?output=toolbar&hl=en&gl=in&q=
const BING_SUGGESTIONS_URL = "";

/**
 * Returns the search provider from a given URL
 */
exports.getSearchProvider = function getSearchProvider(url) {
  if ((new RegExp(GOOGLE_URL_PATTERN)).test(url)) {
    return "Google";
  } else if ((new RegExp(GOOGLE_SCHOLAR_URL_PATTERN)).test(url)) {
    return "Google Scholar";
  } else if ((new RegExp(BING_URL_PATTERN)).test(url)) {
    return "Bing";
  } else if ((new RegExp(YAHOO_URL_PATTERN)).test(url)) {
    return "Yahoo";
  } else if ((new RegExp(WIKIPEDIA_URL_PATTERN)).test(url)) {
    return "Wikipedia";
  } else if ((new RegExp(SOWIPORT_URL_PATTERN)).test(url)) {
    return "Sowiport";
  } else if ((new RegExp(YOUTUBE_PATTERN)).test(url)) {
    return "Youtube";
  } else if ((new RegExp(MS_ACADEMIC_PATTERN)).test(url)) {
    return "MS Academic Search";
  }
}

/**
 * Returns the formatted suggestions depending on the current provider
 */
exports.getSuggestions = function getSuggestions(provider, data) {
  var searchUrl = getSearchUrl(provider);
  var suggestions = [];
  var len = data.length;

  for (var i = 0; i < len; i++) {
    suggestions.push({
      title: data[i],
      url: searchUrl + data[i].replace(/\s/g, '+')
    });
  }

  return suggestions;
}

/**
 * Returns the search URL by the given provider.
 */
function getSearchUrl(provider) {
  if (provider) {
    if (provider.toUpperCase() === "GOOGLE") {
      return GOOGLE_SEARCHURL;
    } else if (provider.toUpperCase() === "GOOGLE SCHOLAR") {
      return GOOGLE_SCHOLAR_SEARCHURL;
    } else if (provider.toUpperCase() === "BING") {
      return BING_SEARCHURL;
    } else if (provider.toUpperCase() === "YAHOO") {
      return YAHOO_SEARCHURL;
    } else if (provider.toUpperCase() === "WIKIPEDIA") {
      return WIKIPEDIA_SEARCHURL;
    } else if (provider.toUpperCase() === "SOWIPORT") {
      return SOWIPORT_SEARCHURL;
    } else if (provider.toUpperCase() === "YOUTUBE") {
      return YOUTUBE_SEARCHURL;
    } else if (provider.toUpperCase() === "MS ACADEMIC SEARCH") {
      return MS_ACADEMIC_SEARCHURL;
    } else {
      return GOOGLE_SEARCHURL;
    }
  } else {
    return GOOGLE_SEARCHURL;
  }
}

/**
 * Returns the query string from a given URL.
 */
exports.getQueryString = function getQueryString(url) {
  var queryString = "";

  if ((new RegExp(GOOGLE_URL_PATTERN)).test(url)) {
    queryString = getUrlParameter("#q", url);

    if (!queryString || queryString.length == 0) {
      queryString = getUrlParameter("q", url);
    }
  } else if ((new RegExp(GOOGLE_SCHOLAR_URL_PATTERN)).test(url)) {
    queryString = getUrlParameter("q", url);
  } else if ((new RegExp(BING_URL_PATTERN)).test(url)) {
    queryString = getUrlParameter("q", url);
  } else if ((new RegExp(YAHOO_URL_PATTERN)).test(url)) {
    queryString = getUrlParameter("p", url);
  } else if ((new RegExp(WIKIPEDIA_URL_PATTERN)).test(url)) {
    queryString = getUrlParameter("search", url);
  } else if ((new RegExp(SOWIPORT_URL_PATTERN)).test(url)) {
    queryString = getUrlParameter("lookfor", url);
  } else if ((new RegExp(YOUTUBE_PATTERN)).test(url)) {
    queryString = getUrlParameter("search_query", url);
  } else if ((new RegExp(MS_ACADEMIC_PATTERN)).test(url)) {
    queryString = getUrlParameter("query", url);
  }

  return queryString != null ? queryString.replace(/\+/g, " ") : "";
}

/**
 * Returns a parameter from a given URL.
 */
function getUrlParameter(name, url) {
  if (url && url.length > 0 && name && name.length > 0) {
    var params = URLToArray(url);
    return params[name];
  }

  return "";
}

/**
 * Transforms an URL into an array.
 */
function URLToArray(url) {
  var request = {};

  if (url && url.length > 0) {
    var pairs = url.substring(url.indexOf('?') + 1).split('&');

    for (var i=0; i<pairs.length; i++) {
      if (!pairs[i])
        continue;

      var pair = pairs[i].split('=');
      request[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);

      if (pairs[i].indexOf('#') >= 0) {
        var hash = pairs[i].substring(pairs[i].indexOf('#') + 1).split('=');
        request["#" + hash[0]] = decodeURIComponent(hash[1]);
      }
    }
  }

  return request;
}

/**
 * Checks if a page is already bookmarked.
 */
exports.isPageAlreadyBookmarked = function isPageAlreadyBookmarked(url, bookmarks) {
  var bookmarked = false;

  Array.forEach(bookmarks, function (bookmark) {
    if (!bookmarked && bookmark.url && url.toLowerCase() === bookmark.url.toLowerCase()) {
      bookmarked = true;
    }
  });

  return bookmarked;
}

/**
 * Returns the tab by a certain URL.
 */
exports.findTabByUrl = function findTabByUrl(url, tabs) {
  var tArray = [];

  Array.forEach(tabs, function (tab) {
    if (url && tab && url.toLowerCase() === tab.url.toLowerCase()) {
      tArray.push(tab);
    }
  });

  return tArray;
}

/**
 * Checks if a tab is already stored.
 */
exports.isTabAlreadyStored = function isTabAlreadyStored(url, tabs) {
  var stored = false;

  Array.forEach(tabs, function (tab) {
    if (tab.parameters != undefined) {
      var tabUrl = getParameterValue(tab, "tabUrl");
      if (!stored && tabUrl != null && url.toLowerCase() === tabUrl.toLowerCase()) {
        stored = true;
      }
    }
  });

  return stored;
}

/**
 * TODO comment
 */
function getParameterValue(obj, key) {
  if (obj != null && key != null && obj.parameters != undefined) {
    for (i = 0; i < obj.parameters.length; i++) {
      var parameter = obj.parameters[i];

      if (parameter.key != undefined && key.toLowerCase() === parameter.key.toLowerCase()) {
        return parameter.value;
      }
    }
  }

  return null;
}

/**
 * DOM insertion library function from MDN
 * https://developer.mozilla.org/en-US/docs/XUL_School/DOM_Building_and_HTML_Insertion
 */
exports.jsonToDOM = function jsonToDOM(xml, doc, nodes) {
  function namespace(name) {
    var m = /^(?:(.*):)?(.*)$/.exec(name);
    return [jsonToDOM.namespaces[m[1]], m[2]];
  }

  function tag(name, attr) {
    if (Array.isArray(name)) {
      var frag = doc.createDocumentFragment();
      Array.forEach(arguments, function (arg) {
        if (!Array.isArray(arg[0]))
          frag.appendChild(tag.apply(null, arg));
        else
          arg.forEach(function (arg) {
            frag.appendChild(tag.apply(null, arg));
          });
      });
      return frag;
    }

    var args = Array.slice(arguments, 2);
    var vals = namespace(name);
    var elem = doc.createElementNS(vals[0] || jsonToDOM.defaultNamespace, vals[1]);

    for (var key in attr) {
      var val = attr[key];
      if (nodes && key == 'key')
        nodes[val] = elem;

      vals = namespace(key);
      if (typeof val == 'function')
        elem.addEventListener(key.replace(/^on/, ''), val, false);
      else
        elem.setAttributeNS(vals[0] || '', vals[1], val);
    }
    args.forEach(function (e) {
      try {
        elem.appendChild(
          Object.prototype.toString.call(e) == '[object Array]' ?
          tag.apply(null, e) :
          e instanceof doc.defaultView.Node ?
          e :
          doc.createTextNode(e)
        );
      } catch (ex) {
        elem.appendChild(doc.createTextNode(ex));
      }
    });
    return elem;
  }
  return tag.apply(null, xml);
}

/**
 * Removes all stopwords from an existing string
 */
exports.filterIllegalCharacters = function filterIllegalCharacters(str) {
  if (str && str.length > 0) {
    ILLEGAL_CHARACTERS.forEach(function(chr) {
      str = str.replace(chr,"");
    });
  }

  return str;
}

/**
 * Removes all stopwords from an existing string
 */
exports.filterStopwords = function filterStopwords(str) {
  if (str && str.length > 0) {
    STOPWORDS.forEach(function(item) {
      var reg = new RegExp('\\s' + item +'\\s','gi');
      str = str.replace(reg, " ");
    });
  }

  return str;
}

/**
 * Removes all duplicates
 */
exports.filterDuplicates = function filterDuplicates(str) {
  var uniqueStr = "";

  if (str && str.length > 0) {
    var uniqueStr=str.split(' ').filter(function(item,i,allItems){
      return i==allItems.indexOf(item);
    }).join(' ');
  }

  return uniqueStr;
}

/**
 * Removes a string from an array.
 */
exports.removeStringFromArray = function removeStringFromArray(str, arr) {
  for (var i=arr.length-1; i>=0; i--) {
    if (arr[i] === str) {
      arr.splice(i, 1);
    }
  }

  return arr;
}

/**
 * Check if the string is a URL.
 */
exports.isUrl = function isUrl(s) {
  var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
  return regexp.test(s);
}

/**
 * Returns the URL for the choosen suggestions provider.
 */
exports.getSuggestionsUrl = function getSuggestionsUrl(provider) {
  if (provider && provider.toUpperCase() === "GOOGLE") {
    return GOOGLE_SUGGESTIONS_URL;
  } else if (provider && provider.toUpperCase() === "BING") {
    return BING_SUGGESTIONS_URL;
  }

  return "";
}
