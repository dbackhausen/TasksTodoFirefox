const STOPWORDS = new Array("a", "about", "above", "above", "across", "after",
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

/**
 * Shows the page notification bar.
 */ 
self.port.on("ShowBookmarkNotification", function(message) {
  if ($('#tt-bookmarkedpage-notification').length != 0) {
    $('#tt-bookmarkedpage-notification').remove();
  }
  
  $("<style>")
    .prop("type", "text/css")
    .html('#tt-bookmarkedpage-notification{width:500px;height:65px;position:fixed;bottom:25px;left:10px;z-index:999999}#tt-bookmarkedpage-notification div.tt-tooltip{float:right;width:430px;text-decoration:none;margin-top:25px;opacity:0;transition:opacity .5s ease-in-out;-moz-transition:opacity .5s ease-in-out;-webkit-transition:opacity .5s ease-in-out}#tt-bookmarkedpage-notification div.tt-tooltip span{font-family:Verdana,"Lucida Sans Unicode",sans-serif;font-size:13px;color:#FFF;background:#00B524;padding:5px;border-radius:3px}#tt-bookmarkedpage-notification div.tt-tooltip.active{opacity:1}')
    .appendTo("head");
  
  var notification = '<div id="tt-bookmarkedpage-notification"><a href="#"><img src="http://taskstodo.org/wordpress/wp-content/uploads/2015/07/thumbs_up.png"/></a><div class="tt-tooltip"><span>You bookmarked this page to your current task!</span></div></div>';
  $(document.body).append(notification);
    
  // Show the bookmark notification text for 5 seconds after page is loaded
  $('div.tt-tooltip').addClass("active").delay(5000).queue(function(next){
    $(this).removeClass("active");
    next();
  });

  $("#tt-bookmarkedpage-notification a").mouseover(function() {
    $('#tt-bookmarkedpage-notification > div.tt-tooltip').addClass("active");
  }).mouseout(function() {
    $('#tt-bookmarkedpage-notification > div.tt-tooltip').removeClass("active");
  });
});

/**
* Hides the page notification bar.
*/ 
self.port.on("HideBookmarkNotification", function() {
  if ($('#tt-bookmarkedpage-notification').length != 0) {
    $('#tt-bookmarkedpage-notification').remove();
  }
});

/**
 * Shows task-related query suggestions.
 */
self.port.on("ShowQuerySuggestions", function(provider, query, goal, task) {
  if ($('#tt-query-suggestions').length != 0) {
    $('#tt-query-suggestions').remove();
  }

  $element = $('body').find('#res');
  
  if ($element) {  
    var suggestions = getQuerySuggestions(query, goal, task);

    if (suggestions.length > 0) {
      var html = '<div id="tt-query-suggestions" style="position:relative;width:100%;height:auto;padding:5px;border:2px solid #61AAC7;margin-bottom:10px">'
      html += '<div style="position:relative;width:auto;height:auto;padding:10px;border:1px solid #999999;background-color:#FAFAFA;font-size:14px;">';
      html += '<strong>Suggested queries regarding your current goal and task:</strong>';
      html += '<ul style="margin-top: 5px;line-height:20px">';

      suggestions.forEach(function(suggestion) {
        html += '<li style="margin-left: 15px"><i><a href="http://www.google.com/search?q=' + suggestion.replace(/\s+/g,"+") +'">' + suggestion +'</a></i></li>';
      });

      html += '</ul>';
      html += '</div>'; 
      html += '</div>'; 

      $element.prepend(html);
    }
  }
});

/**
 * Hides task-related query suggestions.
 */
self.port.on("HideQuerySuggestions", function(provider) {
  if ($('#tt-query-suggestions').length != 0) {
    $('#tt-query-suggestions').remove();
  }
});

/**
 * Shows the bookmark notifications in the search result.
 */
self.port.on("ShowBookmarksInSearchResult", function(history, bookmarks) {
  if ($('.tt-bookmark-date').length != 0) {
    $('.tt-bookmark-date').remove();
  }
  
  if ($('.tt-bookmark-image').length != 0) {
    $('.tt-bookmark-image').remove();
  }
  
  if (history && bookmarks && history.length > 0 && bookmarks.length > 0) {
    $($(document.body)).find('a').each(function(index, element) {
      let url = $(element).attr('href')

      if (url && url.length > 0) {
        bookmarks.forEach(function(bookmark) {
          let urlA = url.replace("https", "http"); // normalize protocoll
          let urlB = bookmark.url.replace("https", "http"); // normalize protocoll

          if (urlA.match(new RegExp("^" + urlB.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "g")) 
            || urlA.match(new RegExp("(.*)yahoo(.*)/RU=" + encodeURIComponent(urlB) + "/RK(.*)", "ig"))) {
            
            if ($(element).closest("div.g").find("div.tt-bookmark-image").length == 0) {
              var x = findInHistory(url, history);
              $(element).append('<div class="tt-bookmark-date"><p style="font-size:9px">Bookmarked page | Created on ' + bookmark.created + ' | Last visit on ' + x + '</p></div>');
              $(element).closest("div.g").append('<div class="tt-bookmark-image" style="position:relative; float:left; padding-right: 10px"><img src="http://taskstodo.org/wordpress/wp-content/uploads/2015/07/thumbs_up.png"></div>');
            }
          }
        });
      }
    }); 
  }
});

/**
 * Hides the bookmark notifications in the search result.
 */ 
self.port.on("HideBookmarksInSearchResult", function() {
  if ($('.tt-bookmark-date').length != 0) {
    $('.tt-bookmark-date').remove();
  }
  
  if ($('.tt-bookmark-image').length != 0) {
    $('.tt-bookmark-image').remove();
  }
});

/**
 * Shows the latest search queries of a certain webpage
 */ 
self.port.on("ShowLatestQueries", function(queries) {
  $('#tt-latest-queries-container').remove();

  if (queries.length > 0) {
    $("<style>")
      .prop("type", "text/css")
      .html('#tt-latest-queries-container{width: 35%; position: fixed; bottom: 35px; right: 35px; z-index: 99999} #tt-latest-queries{width:100%; font:italic 14px Georgia;background-color:#EEE;color:#363636;height:auto;text-align:center;-webkit-border-radius:5px;-moz-border-radius:5px;border-radius:5px;-webkit-box-shadow:rgba(0,0,0,0.8) 0 0 5px;-moz-box-shadow:rgba(0,0,0,0.8) 0 0 5px;box-shadow:rgba(0,0,0,0.8) 0 0 5px;margin:0 auto;padding:1px 2px 2px 2px;}.numberlist{width:100%;text-align:left;}.numberlist ol{counter-reset:li;list-style:none;*list-style:decimal;font:13px "trebuchet MS","lucida sans";padding:0;margin-bottom:4em;margin-left:8em;margin:0 0 0 2em;}.numberlist ol li{margin:0 1em 0 0;}.numberlist a{position:relative;display:block;padding:.4em .4em .4em 2em;*padding:.4em;margin:.9em 0;background:#FFF;color:#444;text-decoration:none;-moz-border-radius:.3em;-webkit-border-radius:.3em;border-radius:.3em;}.numberlist a span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.numberlist a:hover{background:#87ceeb;text-decoration:underline;}.numberlist a:before{content:counter(li);counter-increment:li;position:absolute;left:-1.3em;top:50%;margin-top:-1.3em;background:#87ceeb;height:2em;width:2em;line-height:2em;border:.3em solid #fff;text-align:center;font-weight:700;-moz-border-radius:2em;-webkit-border-radius:2em;border-radius:2em;color:#FFF;}')
      .appendTo("head");

    var message = '<div id="tt-latest-queries-container">';
    message += '<div id="tt-latest-queries"><p>Your latest task related queries:</p>'
    message += '<div class="numberlist"><ol>';

    var cnt = 1;

    queries.reverse().forEach(function(query) {
      if (cnt <= 5) {
        var u = null;
        var q = null;

        if (query != null && query.parameters != null && query.parameters.length > 0) {
          query.parameters.forEach(function(parameter) {
            if (parameter.key == "url") {
              u = parameter.value;
            } else if (parameter.key == "query") {
              q = parameter.value;
            }
          });

          if (u != null && u.length > 0 && q != null && q.length > 0) {
            message += '<li><a href="' + u + '">' + q + '</a></li>';
          }  
        }

        cnt++;
      }
    });

    message += '</ol>';
    message += '</div></div></div>';

    $(document.body).append(message);
  }
});

/**
* Hides the latest search queries of a certain webpage.
*/ 
self.port.on("HideLatestQueries", function() {
  if ($('#tt-latest-queries-container').length != 0) {
    $('#tt-latest-queries-container').remove();
  }
});

// --- HELPER ---

/**
 * Helper method to search the browse history for any given URL.
 */
function findInHistory(url, history) {
  var x = undefined;
  
  history.reverse().forEach(function(entry) {
    for (i = 0; i < entry.parameters.length; i++) { 
      let parameter = entry.parameters[i];

      if (parameter.key == "url") {
        if (url.replace(parameter.value, "").length == 0) {
          x = entry.created;
          return x;
        }
      }
    }    
  });
  
  return x;
}

/**
 * Returns an array of query suggestions
 */
function getQuerySuggestions(query, goal, task) {
  _query = (filterStopwords(" " + query + " ").toLowerCase().replace(/\s+/g," ")).trim();
  _gTitle = (filterStopwords(" " + goal + " ").toLowerCase().replace(/\s+/g," ")).trim();
  _tTitle = (filterStopwords(" " + task + " ").toLowerCase().replace(/\s+/g," ")).trim();
    
  var suggestions = [];

  if (_gTitle && _gTitle.length > 0) {
    var _gTitleSplit = _gTitle.split(" ");
    
    if (_gTitleSplit.length > 0) {
      // Add a random string from the goal title as suggestion
      let index = Math.floor(Math.random() * _gTitleSplit.length);
      let suggestion = filterDuplicates((_gTitleSplit[index] + " " + _query).replace(/\s+/g," "));
        
      if (suggestion !== _query) {
        suggestions.push(suggestion);
      }
    }
    
    // Add the complete goal title as suggestion
    let suggestion = filterDuplicates((_gTitle + " " + _query).replace(/\s+/g," "));
    
    if (suggestion !== _query) {
      suggestions.push(suggestion);
    }    
  }

  if (_tTitle && _tTitle.length > 0) {
    var _tTitleSplit = _tTitle.split(" ");
    
    if (_tTitleSplit.length > 0) {      
      // Add a random string from the task title as suggestion
      let index = Math.floor(Math.random() * _gTitleSplit.length);
      let suggestion = filterDuplicates((_tTitleSplit[index] + " " + _query).replace(/\s+/g," "));
        
      if (suggestion !== _query) {
        suggestions.push(suggestion);
      }
    }
    
    // Add the complete task title as suggestion
    let suggestion = filterDuplicates((_tTitle + " " + _query).replace(/\s+/g," "));
    
    if (suggestion !== _query) {
      suggestions.push(suggestion);
    }  
  }

  return suggestions;
}

/**
 * Removes stop words from queries strings
 */
function filterStopwords(str) {
  STOPWORDS.forEach(function(item) {
    var reg = new RegExp('\\s' + item +'\\s','gi')
    str = str.replace(reg, " ");
  });
  
  return str;  
}

function filterDuplicates(str) {
  var uniqueList=str.split(' ').filter(function(item,i,allItems){
    return i==allItems.indexOf(item);
  }).join(' ');

  return uniqueList;
}
