/**
 * Shows the page notification bar.
 */ 
self.port.on("ShowBookmarkNotification", function(message) {
  if ($('#tt-bookmarkedpage-notification').length != 0) {
    $('#tt-bookmarkedpage-notification').remove();
  }
  
  if($("style:contains('#tt-bookmarkedpage-notification')").length == 0) {
    $("<style>")
      .prop("type", "text/css")
      .html('#tt-bookmarkedpage-notification{width:500px;height:65px;position:fixed;top:25px;left:50%;margin-left:-250px;z-index:999999;transition:opacity .5s ease-in-out;-moz-transition:opacity .5s ease-in-out;-webkit-transition:opacity .5s ease-in-out;text-align:center;opacity:0}#tt-bookmarkedpage-notification.active{opacity:1}#tt-bookmarkedpage-notification span{font-family:Verdana,"Lucida Sans Unicode",sans-serif;font-size:13px;color:#FFF;background:#00B524;padding:5px;border-radius:3px}')
      .appendTo("head");
  }
  
  var notification = '<div id="tt-bookmarkedpage-notification"><span>You bookmarked this page in your current task!</span></div>';
  $(document.body).append(notification);
    
  // Show the bookmark notification text for 5 seconds after page is loaded
  $('#tt-bookmarkedpage-notification').addClass("active").delay(5000).queue(function(next){
    $(this).removeClass("active");
    next();
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
 * Shows the bookmark notifications in the search result.
 */
self.port.on("ShowBookmarksInSearchResult", function(provider, history, bookmarks) {  
  if (provider.toUpperCase() === "MS ACADEMIC SEARCH") {
    return;
  }
    
  if ($('.tt-bookmark-date').length != 0) {
    $('.tt-bookmark-date').remove();
  }
  
  if (bookmarks && bookmarks.length > 0) {
    $(document.body).find('a').each(function(index, element) {
      var url = $(element).attr('href');
      
      if (url && url.length > 0) {
        bookmarks.forEach(function(bookmark) {
          var urlA = url.replace("https", "http"); // normalize protocoll
          var urlB = bookmark.url.replace("https", "http"); // normalize protocoll
          var relativeUrlA = urlA.replace(/^(?:\/\/|[^\/]+)*\//, "");
          var relativeUrlB = urlB.replace(/^(?:\/\/|[^\/]+)*\//, "");
 
          // Check when the page was last visited
          var lastVisit = findInHistory(url, history);
          var bookmarked = formatDate(bookmark.created.toString());
          
          if (lastVisit && lastVisit !== undefined) {
            lastVisit = formatDate(lastVisit);
          } else {
            lastVisit = bookmark.created.toString();
          }
          
          if (urlA.match(new RegExp("^" + urlB.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "g")) 
              || urlA.match(new RegExp("(.*)yahoo(.*)/RU=" + encodeURIComponent(urlB) + "/RK(.*)", "ig"))
              || relativeUrlA === relativeUrlB) {
          
            var bookmarkColor = "#EAFCE3";
            var bookmarkedText = '<div class="tt-bookmark-date" style="width:100%;padding:2px"><p style="font-size:10px; color:#3F9E46">BOOKMARKED PAGE&nbsp;&nbsp;|&nbsp;&nbsp;Created on ' + bookmarked + '&nbsp;&nbsp;|&nbsp;&nbsp;Last visit on ' + lastVisit + '</p></div>'; 
            
            if (provider.toUpperCase() === "GOOGLE") {
              $(element).closest("div.rc").css("background-color", bookmarkColor);
              $(element).parent().append(bookmarkedText);
            } else if (provider.toUpperCase() === "GOOGLE SCHOLAR") {
              $(element).closest("div.gs_ri").css("background-color", bookmarkColor);
              $(element).parent().append(bookmarkedText);
            } else if (provider.toUpperCase() === "BING") {
              $(element).closest("li").css("background-color", bookmarkColor);
              $(element).parent().append(bookmarkedText);
            } else if (provider.toUpperCase() === "YAHOO") {
              $(element).closest("li").css("background-color", bookmarkColor);
              $(element).parent().append(bookmarkedText);
            } else if (provider.toUpperCase() === "WIKIPEDIA") {
              $(element).closest("li").css("background-color", bookmarkColor);
              $(element).parent().append(bookmarkedText);
            } else if (provider.toUpperCase() === "SOWIPORT") {
              if ($(element).closest("div.kurztitel").find("div.tt-bookmark-image").length == 0) {
                $(element).closest("table.littabkurz").css("background-color", bookmarkColor);
                $(element).append(bookmarkedText);
              }
            } else if (provider.toUpperCase() === "YOUTUBE") {
              $(element).closest("div.rc").css("background-color", bookmarkColor);
              $(element).parent().append(bookmarkedText);
            } else if (provider.toUpperCase() === "MS ACADEMIC SEARCH") { // Currently script doesn't work!
              $(element).closest("li").css("background-color", bookmarkColor);
              $(element).parent().append(bookmarkedText);
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
  
  $($(document.body)).find('a').each(function(index, element) {
    $(element).closest("div.rc").css("background-color", "transparent"); // Google
    $(element).closest("li").css("background-color", "transparent"); // Yahoo
    $(element).closest("table.littabkurz").css("background-color", "transparent"); // Sowiport
  });
});

/**
 * Shows the latest search queries of a certain webpage
 */ 
self.port.on("ShowLatestQueries", function(queries) {
  $element = $('body');
  
  if ($('#tt-container').length == 0) {
    $element.append('<div id="tt-container" style="width:auto;position:fixed;bottom:15px;right:15px;z-index:99999;margin:0px !important;padding:0px !important"><div>')
  }
  
  if ($('#tt-latest-queries-container').length != 0) {
    $('#tt-latest-queries-container').remove();
  }
  
  if (queries.length > 0) {
    if($("style:contains('#tt-latest-queries-container')").length == 0) {
      $("<style>")
        .prop("type", "text/css")
        .html('#tt-latest-queries-container{font-family:Arial!important;background-color:#fff;-webkit-border-radius:2px;-moz-border-radius:2px;border-radius:2px;-webkit-box-shadow:rgba(0,0,0,.8) 0 0 5px;-moz-box-shadow:rgba(0,0,0,.8) 0 0 5px;box-shadow:rgba(0,0,0,.8) 0 0 5px;padding:0 10px 10px}#tt-latest-queries-top{display:flex;height:40px}#tt-latest-queries-top div.button{width:65px;padding:10px 0;background-color:#fff}#tt-latest-queries-top div.button button{border:none;background-color:#fff;background-image:none;width:100%;min-width:0;height:auto;font-size:11px;font-weight:400;text-align:right}#tt-latest-queries-top div.button button:hover{background-color:#fff;background-image:none;border:none;box-shadow:none}#tt-latest-queries-top div.button button.n-resize{cursor:n-resize}#tt-latest-queries-top div.button button.s-resize{cursor:s-resize}#tt-latest-queries-top div.text{flex:1}#tt-latest-queries-top h1{font-size:14px!important;color:#333;font-style:italic;font-weight:700;white-space:nowrap;text-align:left;padding:10px 0}#tt-latest-queries div.tt-entry{display:table;width:100%;height:30px;max-height:30px;min-height:30px;margin-bottom:0;padding:5px 0;border-top:1px solid #EEE}#tt-latest-queries div.tt-left{display:table-cell;background-color:#87ceeb;width:3px;height:30px;max-height:30px;min-height:30px;float:left}#tt-latest-queries div.tt-content{width:auto;min-width:50%;height:30px;max-height:30px;min-height:30px;float:left;display:table;line-height:13px;padding-left:5px}#tt-latest-queries div.tt-content a{width:100%;color:#666;text-decoration:none;display:table-cell}#tt-latest-queries div.tt-content a:hover{color:#87ceeb}#tt-latest-queries div.tt-content span.tt-query{font-size:14px;margin-top:8px}#tt-latest-queries div.tt-content span.tt-date{font-size:9px;font-style:italic}')
        .appendTo("head");
    }
    
    var html = '<div id="tt-latest-queries-container">';
    html += '<div id="tt-latest-queries-top">';
    html += '<div class="text"><h1>Your latest task-related queries on this page:</h1></div>';
    html += '<div class="button"><button>Hide</button></div>';
    html += '</div>';
    html += '<div id="tt-latest-queries">';

    var cnt = 1;
    var qBag = new Array(); // track and remove duplicates

    queries.forEach(function(query) {
      var u = null;
      var q = null;
      var c = null;
            
      if (query != null && query.parameters != null && query.parameters.length > 0) {
        query.parameters.forEach(function(parameter) {
          if (parameter.key == "url") {
            u = parameter.value;
          } else if (parameter.key == "query") {
            q = parameter.value;
            c = new Date(parameter.created);
          }
        });

        if (cnt <= 5 && u && u.length > 0 && q && q.length > 0 && qBag.indexOf(q) == -1 && c) {
          html += '<div class="tt-entry">';
          html += '<div class="tt-left">';
          html += '</div>';
          html += '<div class="tt-content">';
          html += '<a href="' + u + '">';
          html += '<span class="tt-query">' + q + '</span><br/>';
          html += '<span class="tt-date">' + c.toLocaleString() +'</span>';
          html += '</a>';
          html += '</div>';
          html += '</div>';
          
          qBag.push(q);
          cnt++;
        }  
      }
    });

    html += '</div></div>';

    $('#tt-container').append(html);
    
    // Add toogle functionality
    $("#tt-latest-queries-top button").addClass('s-resize');
    $("#tt-latest-queries-top button").click(function() {
      $("#tt-latest-queries").slideToggle(function() {
        if ($(this).is(":visible")) {
          $("#tt-latest-queries-top button").text('Hide');
          $("#tt-latest-queries-top button").removeClass('n-resize');
          $("#tt-latest-queries-top button").addClass('s-resize');
        } else {
          $("#tt-latest-queries-top button").text('Show');  
          $("#tt-latest-queries-top button").removeClass('s-resize');
          $("#tt-latest-queries-top button").addClass('n-resize');  
        }
      });
    });
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

/**
 * Shows task-related query suggestions.
 */
self.port.on("ShowQuerySuggestions", function(suggestions) {
  $element = $('body');
  
  if ($('#tt-container').length == 0) {
    $element.append('<div id="tt-container" style="width:auto;position:fixed;bottom:15px;right:15px;z-index:99999;margin:0px !important;padding:0px !important"><div>')
  }
  
  if ($('#tt-query-suggestions-container').length != 0) {
    $('#tt-query-suggestions-container').remove();
  }  
  
  if ($element) {    
    if (suggestions && suggestions.length > 0) {
      if($("style:contains('#tt-query-suggestions-container')").length == 0) {
        $("<style>")
          .prop("type", "text/css")
          .html('#tt-query-suggestions-container{font-family:Arial!important;background-color:#fff;margin-top:10px;-webkit-border-radius:2px;-moz-border-radius:2px;border-radius:2px;-webkit-box-shadow:rgba(0,0,0,.8) 0 0 5px;-moz-box-shadow:rgba(0,0,0,.8) 0 0 5px;box-shadow:rgba(0,0,0,.8) 0 0 5px;padding:0 10px 10px}#tt-query-suggestions-top{display:flex;height:40px}#tt-query-suggestions-top div.button{width:65px;padding:10px 0;background-color:#fff}#tt-query-suggestions-top div.button button{border:none;background-color:#fff;background-image:none;width:100%;min-width:0;height:auto;font-size:11px;font-weight:400;text-align:right}#tt-query-suggestions-top div.button button:hover{background-color:#fff;background-image:none;border:none;box-shadow:none}#tt-query-suggestions-top div.button button.n-resize{cursor:n-resize}#tt-query-suggestions-top div.button button.s-resize{cursor:s-resize}#tt-query-suggestions-top div.text{flex:1}#tt-query-suggestions-top h1{font-size:14px!important;color:#333;font-style:italic;font-weight:700;white-space:nowrap;text-align:left;padding:10px 0}#tt-query-suggestions{color:#666;font-size:14px}#tt-query-suggestions div.entry{width:100%;height:20px;margin-bottom:0;padding:5px 0;border-top:1px solid #EEE}#tt-query-suggestions div.entry a{color:#666;width:100%}#tt-query-suggestions div.left{background-color:#87ceeb;width:3px;height:20px;float:left}#tt-query-suggestions div.querystring{height:20px;float:left;line-height:20px;vertical-align:middle;padding-left:5px}#tt-query-suggestions div.querystring span{white-space:nowrap;display:inline-block}#tt-query-suggestions div.querystring:hover{color:#87ceeb}')
          .appendTo("head");
      }
      
      var html = '<div id="tt-query-suggestions-container">';
      html += '<div id="tt-query-suggestions-top">';
      html += '<div class="text"><h1>Suggestions regarding your query:</h1></div>';
      html += '<div class="button"><button>Hide</button></div>';
      html += '</div>';
      html += '<div id="tt-query-suggestions">';
      
      suggestions.forEach(function(suggestion) {
        html += '<div class="entry">';
        html += '<a href="' + suggestion.url + '">';
        html += '<div class="left"></div>';
        html += '<div class="querystring">';
        html += '<span>' + suggestion.title + '</span>';
        html += '</div>';
        html += '</a>';
        html += '</div>';
      });

      html += '</div></div>';

      $('#tt-container').append(html);
      
      // Add toogle functionality
      $("#tt-query-suggestions-top button").addClass('s-resize');
      $("#tt-query-suggestions-top button").click(function() {
        $("#tt-query-suggestions").slideToggle(function() {
          if ($(this).is(":visible")) {
            $("#tt-query-suggestions-top button").text('Hide');
            $("#tt-query-suggestions-top button").removeClass('n-resize');
            $("#tt-query-suggestions-top button").addClass('s-resize');
          } else {
            $("#tt-query-suggestions-top button").text('Show');  
            $("#tt-query-suggestions-top button").removeClass('s-resize');
            $("#tt-query-suggestions-top button").addClass('n-resize');  
          }
        });
      });
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
 * Formats a given date in more readable way.
 */
function formatDate(dateString) {
  if (dateString && dateString.length > 0) {
    var date = new Date(dateString);
    return date.toLocaleString();
  }
  
  return null;
}
