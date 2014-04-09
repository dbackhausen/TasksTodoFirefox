
var activeBrowserWindow = require("sdk/window/utils").getMostRecentBrowserWindow();
var {Cc, Ci} = require("chrome");
var Request = require("sdk/request").Request;

/**
 * TASKS
 */
function loadTasks(worker, projectId) {
	var request = Request({
		url: "http://localhost:8080/taskstodo/tasks/api/list/"/*+projectId*/,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json"
		},

		onComplete: function (response) {
        	worker.port.emit("TasksLoaded", response.json);
		}
	}).get();
} exports.loadTasks = loadTasks;

function addTask(worker, task) {
	if (task != null) {
		var request = Request({
			url: "http://localhost:8080/taskstodo/tasks/api/create/" + "52950ebe3004676c2b42a108",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: task,

			onComplete: function (response) {
	        	worker.port.emit("TaskAdded", response.json);
			}
		}).post();
	}
} exports.addTask = addTask;

function updateTask(worker, task) {
	if (task != null) {
		var json = {
			"title" : task.title, 
			"description" : task.description,
			"dueDate" : task.dueDate,
			"reminderDate" : task.reminderDate,
			"urgency" : task.urgency,
			"priority" : task.priority
		};

		var request = Request({
			url: "http://localhost:8080/taskstodo/tasks/api/update/"+task.idAsString,
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(json),

			onComplete: function (response) {
	        	worker.port.emit("TaskUpdated", response.json);
			}
		}).put();
	}
} exports.updateTask = updateTask;

function deleteTask(worker, task) {
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
		}).post();
	}
} exports.deleteTask = deleteTask;

/**
 * NOTES
 */
function loadNotes(worker, taskId) {
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
				worker.port.emit("NotesLoaded", response.json);
			}
		}
	}).get();
} exports.loadNotes = loadNotes;

function addNote(worker, note, taskId) {
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
				} else {
					worker.port.emit("NoteAdded", response.json); 
				}
			}
		}).post();
	}
} exports.addNote = addNote;

function updateNote(worker, note) {
	if (note != null) {
		var json = { "body" : note.body };

		var request = Request({
			url: "http://localhost:8080/taskstodo/notes/api/update/"+note.idAsString,
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(json),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.text);			
				} else {
					worker.port.emit("NoteUpdated", response.json);
				}
			}
		}).put();
	}
} exports.updateNote = updateNote;

function deleteNote(worker, note) {
	var request = Request({
		url: "http://localhost:8080/taskstodo/notes/api/delete/"+note.idAsString,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json",
			"pragma": "no-cache"
		},

		onComplete: function (response) {
			if (response.status != 204) {
				console.error(response.text);
			} else {
				worker.port.emit("NoteDeleted", response.json);
			}
		}
	}).post();
} exports.deleteNote = deleteNote;

/**
 * LINKS
 */
function loadLinks(worker, taskId) {
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
				worker.port.emit("LinksLoaded", response.json);
			}
		}
	}).get();
} exports.loadLinks = loadLinks;

function addLink(worker, link, taskId) {
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
				} else {
					worker.port.emit("LinkAdded", response.json); 
				}
			}
		}).post();
	}
} exports.addLink = addLink;

function updateLink(worker, link) {
	if (link != null) {
		var json = { 
			"url" : link.url,
			"title" : link.title, 
			"description" : link.description
		};

		var request = Request({
			url: "http://localhost:8080/taskstodo/links/api/update/"+link.idAsString,
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(json),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.text);			
				} else {
					worker.port.emit("LinkUpdated", response.json);
				}
			}
		}).put();
	}
} exports.updateLink = updateLink;

function deleteLink(worker, link) {
	var request = Request({
		url: "http://localhost:8080/taskstodo/links/api/delete/"+link.idAsString,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json",
			"pragma": "no-cache"
		},

		onComplete: function (response) {
			if (response.status != 204) {
				console.error(response.text);
			} else {
				worker.port.emit("LinkDeleted", response.json);
			}
		}
	}).post();
} exports.deleteLink = deleteLink;

/**
 * FILES
 */

/**
 * HISTORY
 */
