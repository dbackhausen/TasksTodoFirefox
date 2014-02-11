
var activeBrowserWindow = require("sdk/window/utils").getMostRecentBrowserWindow();
var {Cc, Ci} = require("chrome");
var Request = require("sdk/request").Request;

/**
 * TASKS
 */
function loadTasks(panel, projectId) {
	var request = Request({
		url: "http://localhost:8080/taskstodo/tasks/api/list/"/*+projectId*/,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json"
		},

		onComplete: function (response) {
        	panel.port.emit("TasksLoaded", response.json);
		}
	}).get();
} exports.loadTasks = loadTasks;

function addTask(panel, task, projectId) {
	if (task != null) {
		var json = { "title" : task.title };

		var request = Request({
			url: "http://localhost:8080/taskstodo/tasks/api/create/"+projectId,
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(json),

			onComplete: function (response) {
	        	console.log("Status: " + response.status);
	        	console.log("Response json: " + JSON.stringify(response));
			}
		}).post();
	}
} exports.addTask = addTask;

function updateTask(panel, task) {
	if (task != null) {
		var json = { "title" : task.title };

		var request = Request({
			url: "http://localhost:8080/taskstodo/tasks/api/update/"+task.idAsString,
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(json),

			onComplete: function (response) {
	        	console.log("Status: " + response.status);
	        	console.log("Response json: " + JSON.stringify(response));
			}
		}).put();
	}
} exports.updateTask = updateTask;

function deleteTask(panel, task) {
	if (task != null) {
		var request = Request({
			url: "http://localhost:8080/taskstodo/tasks/api/delete/" + task.idAsString,
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},

			onComplete: function (response) {
	        	console.log("Status: " + response.status);
	        	console.log("Response json: " + JSON.stringify(response));
			}
		}).delete();
	}
} exports.deleteTask = deleteTask;

/**
 * NOTES
 */
function loadNotes(panel, taskId) {
	var request = Request({
		url: "http://localhost:8080/taskstodo/notes/api/list/"+taskId,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json"
		},

		onComplete: function (response) {
			if (response.status != 200) {
				console.error(response.text);
			} else {
				panel.port.emit("NotesLoaded", response.json);
			}
		}
	}).get();
} exports.loadNotes = loadNotes;

function addNote(panel, note, taskId) {
	if (note != null) {
		var request = Request({
			url: "http://localhost:8080/taskstodo/notes/api/create/"+taskId,
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: note,

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.text);
					console.log(note);				
				} else {
					panel.port.emit("NoteAdded", response.json);
				}
			}
		}).post();
	}
} exports.addNote = addNote;

function updateNote(panel, note) {
	if (note != null) {
		var request = Request({
			url: "http://localhost:8080/taskstodo/notes/api/update/"+note.idAsString,
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: note,

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.text);
					console.log(note);				
				} else {
					panel.port.emit("NoteUpdated", response.json);
				}
			}
		}).put();
	}
} exports.updateNote = updateNote;

function deleteNote(panel, note) {
	var request = Request({
		url: "http://localhost:8080/taskstodo/notes/api/delete/"+note.idAsString,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json",
			"pragma": "no-cache"
		},

		onComplete: function (response) {
			if (response.status != 200) {
				console.error(response.text);
				console.log(note);				
			} else {
				panel.port.emit("NoteDeleted", response.json);
			}
		}
	}).delete();
} exports.deleteNote = deleteNote;

/**
 * LINKS
 */
function loadLinks(panel, taskId) {
	var request = Request({
		url: "http://localhost:8080/taskstodo/links/api/list/"+taskId,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json"
		},

		onComplete: function (response) {
			if (response.status != 200) {
				console.error(response.text);
			} else {
				panel.port.emit("LinksLoaded", response.json);
			}
		}
	}).get();
} exports.loadLinks = loadLinks;

function addLink(panel, link, taskId) {
	if (link != null) {
		var request = Request({
			url: "http://localhost:8080/taskstodo/links/api/create/"+taskId,
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: link,

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.text);
					console.log(link);				
				} else {
					panel.port.emit("LinkAdded", response.json);
				}
			}
		}).post();
	}
} exports.addLink = addLink;

function updateLink(panel, link) {
	if (link != null) {
		var request = Request({
			url: "http://localhost:8080/taskstodo/links/api/update/"+link.idAsString,
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: link,

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.text);
					console.log(link);				
				} else {
					panel.port.emit("LinkUpdated", response.json);
				}
			}
		}).put();
	}
} exports.updateLink = updateLink;

function deleteLink(panel, link) {
	var request = Request({
		url: "http://localhost:8080/taskstodo/links/api/delete/"+link.idAsString,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json",
			"pragma": "no-cache"
		},

		onComplete: function (response) {
			if (response.status != 200) {
				console.error(response.text);
				console.log(link);				
			} else {
				panel.port.emit("LinkDeleted", response.json);
			}
		}
	}).delete();
} exports.deleteLink = deleteLink;

/**
 * FILES
 */

/**
 * HISTORY
 */
