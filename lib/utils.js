const GOOGLE_URL_PATTERN = /((http|https):\/\/www\.google\.(de|com)(\/(.*))?)/;
const GOOGLE_SCHOLAR_URL_PATTERN = /((http|https):\/\/scholar\.google\.(de|com)(\/(.*))?)/;
const BING_URL_PATTERN = /((http|https):\/\/www\.bing\.(de|com)(\/(.*))?)/;
const YAHOO_URL_PATTERN = /((http|https):\/\/(.*)?\.search.yahoo\.com(\/(.*))?)/;
const WIKIPEDIA_URL_PATTERN = /((http|https):\/\/((www|de)\.)?wikipedia\.(de|org|com)(\/(.*))?)/;
const SOWIPORT_URL_PATTERN = /((http|https):\/\/sowiportbeta\.gesis\.org(\/(.*))?)/;
const YOUTUBE_PATTERN = /((http|https):\/\/www\.youtube\.com(\/(.*))?)/;
const MS_ACADEMIC_PATTERN = /((http|https):\/\/academic\.research\.microsoft\.com(\/(.*))?)/;

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
 * Returns the query string from a given URL.
 */
exports.getQueryString = function getQueryString(url) {
  var queryString = "";
  
  if ((new RegExp(GOOGLE_URL_PATTERN)).test(url)) {
    queryString = getUrlParameter("q", url);
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
  
  return queryString;
}

/**
 * Returns a parameter from a given URL.
 */
function getUrlParameter(name, url) {
  var q = url.substring(url.indexOf('?'));
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&#]" + name + "=([^&#]*)"),
      results = regex.exec(q);
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
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
