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
