self.port.on("ShowPageNotification", function(message) {
	var css = 'width:100%; margin: 0px; padding: 5px; background-color: green; color: white; font-family: Arial; font-size: 14px; text-align: left; vertical-align: middle';
	$('body').prepend('<div id="taskstodo-notification-layer" style="' + css + '">' + message + '</div>');
});

self.port.on("ShowLatestGoogleQueries", function(queries) {
	var message = '<div id="latest-google-queries">Your latest Google queries for this task were:<div class="numberlist"><ol>';

	var cnt = 1;
	queries.reverse().forEach(function(query) {
		if (cnt <= 5) {		
	    	message += "<li>" + query + "</li>";
		}
    	cnt++;
	});

	message += '</ol>';
    message += '</div></div>';

	$('#body').append(message);

	$("<style>")
    	.prop("type", "text/css")
    	.html('#latest-google-queries { font: italic 16px Georgia; background-color: #EEE; color: #363636; width: 75%; height: auto; text-align: center; -webkit-border-radius: 10px; -moz-border-radius: 10px; border-radius: 10px; -webkit-box-shadow: rgba(0,0,0,0.8) 0 0 10px; -moz-box-shadow: rgba(0,0,0,0.8) 0 0 10px; box-shadow: rgba(0,0,0,0.8) 0 0 10px; margin: 0 auto; padding: 10px; } .numberlist { width: 100%; text-align: left; } .numberlist ol { counter-reset: li; list-style: none; *list-style: decimal; font: 15px "trebuchet MS", "lucida sans"; padding: 0; margin-bottom: 4em; margin-left: 8em; margin: 0 0 0 2em; } .numberlist ol li { margin: 0 1em 0 0; } .numberlist a { position: relative; display: block; padding: .4em .4em .4em 2em; *padding: .4em; margin: .9em 0; background: #FFF; color: #444; text-decoration: none; -moz-border-radius: .3em; -webkit-border-radius: .3em; border-radius: .3em; } .numberlist a span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .numberlist a:hover { background: #87ceeb; text-decoration: underline; } .numberlist a:before { content: counter(li); counter-increment: li; position: absolute; left: -1.3em; top: 50%; margin-top: -1.3em; background: #87ceeb; height: 2em; width: 2em; line-height: 2em; border: .3em solid #fff; text-align: center; font-weight: 700; -moz-border-radius: 2em; -webkit-border-radius: 2em; border-radius: 2em; color: #FFF; }')
    	.appendTo("head");

    	console.log(message);
});