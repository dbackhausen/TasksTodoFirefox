self.port.on("ShowPageNotification", function(message) {
	var css = 'width:100%; margin: 0px; padding: 5px; background-color: green; color: white; font-family: Arial; font-size: 14px; text-align: left; vertical-align: middle';
	$('body').prepend('<div id="taskstodo-notification-layer" style="' + css + '">' + message + '</div>');
});

self.port.on("ShowLatestGoogleQueries", function(queries) {
	var message = "<p>Your latest google queries for this task were:</p>";

	queries.forEach(function(query) {
    	message += "<p>" + query + "</p>";
	});

	$('#body').append(message);
});