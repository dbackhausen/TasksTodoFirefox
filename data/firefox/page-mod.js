/**
* Shows the page notification bar.
*/ 
self.port.on("ShowPageNotification", function(message) {
  if ($('#tt-notification-layer').length != 0) {
    $('#tt-notification-layer').remove();
  }

  var html  = '<div id="tt-notification-layer" style="width:100%; height: 40px; background-color:#3F9D3F; top: 0px">';
  html += '<div style="width: 200px; height: 40px; float: right; text-align: right;"><img src="http://taskstodo.org/wordpress/wp-content/uploads/2015/04/bookmark1.png" style="height: 40px" /></div>';
  html += '<div style="height: 40px; padding: 10px 0px 0px 30px; overflow: hidden; font: bold 14px Georgia;">' + message + '</div>';
  html += '</div>';

  $(document.body).prepend(html);
});

/**
* Hides the page notification bar.
*/ 
self.port.on("HidePageNotification", function() {
  if ($('#tt-notification-layer').length != 0) {
    $('#tt-notification-layer').remove();
  }
});

/**
* Shows the latest search queries of a certain webpage
*/ 
self.port.on("ShowLatestQueries", function(queries) {
  if ($('#tt-latest-queries-container').length != 0) {
    $('#tt-latest-queries-container').remove();
  }

  if (queries.length > 0) {
    $("<style>")
      .prop("type", "text/css")
      .html('#tt-latest-queries{width:100%; font:italic 14px Georgia;background-color:#EEE;color:#363636;height:auto;text-align:center;-webkit-border-radius:5px;-moz-border-radius:5px;border-radius:5px;-webkit-box-shadow:rgba(0,0,0,0.8) 0 0 5px;-moz-box-shadow:rgba(0,0,0,0.8) 0 0 5px;box-shadow:rgba(0,0,0,0.8) 0 0 5px;margin:0 auto;padding:1px 2px 2px 2px;}.numberlist{width:100%;text-align:left;}.numberlist ol{counter-reset:li;list-style:none;*list-style:decimal;font:13px "trebuchet MS","lucida sans";padding:0;margin-bottom:4em;margin-left:8em;margin:0 0 0 2em;}.numberlist ol li{margin:0 1em 0 0;}.numberlist a{position:relative;display:block;padding:.4em .4em .4em 2em;*padding:.4em;margin:.9em 0;background:#FFF;color:#444;text-decoration:none;-moz-border-radius:.3em;-webkit-border-radius:.3em;border-radius:.3em;}.numberlist a span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.numberlist a:hover{background:#87ceeb;text-decoration:underline;}.numberlist a:before{content:counter(li);counter-increment:li;position:absolute;left:-1.3em;top:50%;margin-top:-1.3em;background:#87ceeb;height:2em;width:2em;line-height:2em;border:.3em solid #fff;text-align:center;font-weight:700;-moz-border-radius:2em;-webkit-border-radius:2em;border-radius:2em;color:#FFF;}')
      .appendTo("head");

    var message = '<div id="tt-latest-queries-container" style="width: 35%; position: fixed; bottom: 35px; right: 35px; z-index: 99999">';
    message += '<div id="tt-latest-queries"><p>Your latest task related queries for this site were:</p>'
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
