
var activeBrowserWindow = require("sdk/window/utils").getMostRecentBrowserWindow();
var {Cc, Ci} = require("chrome");
var Request = require("sdk/request").Request;

var api_url = "http://localhost:8080/taskstodo/"

/////////////////////////////////////////////////////////////////////////////
// USER                                                                    //
/////////////////////////////////////////////////////////////////////////////

function loginUser(worker, user) {
    console.log("Requesting login for " + JSON.stringify(user));

	var request = Request({
		url: api_url + "users/api/login/",
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json",
			"pragma": "no-cache"
		},
		content: user,

		onComplete: function (response) {
        	if (response.status != 200) {
				console.error(response.status + ": " + response.text);			
			} else {
				console.log("Response is " + JSON.stringify(response.json));
				worker.port.emit("UserLoggedIn", response.json);
			}
		}
	}).post();
} exports.loginUser = loginUser;

/////////////////////////////////////////////////////////////////////////////
// GOALS                                                                   //
/////////////////////////////////////////////////////////////////////////////

function loadGoals(worker, userId) {
	var request = Request({
		url: api_url + "goals/api/list/" + userId,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json"
		},

		onComplete: function (response) {
			if (response.status != 200) {
				console.error(response.text);			
			} else {
				worker.port.emit("GoalsLoaded", response.json);
			}
		}
	}).get();
} exports.loadGoals = loadGoals;

function addGoal(worker, goal) {
	if (goal != null) {
		var request = Request({
			url: api_url + "goals/api/create/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(goal),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);			
				} else {
					worker.port.emit("GoalAdded", response.json);
				}
			}
		}).post();
	}
} exports.addGoal = addGoal;

function updateGoal(worker, goal) {
	if (goal != null) {
		var request = Request({
			url: api_url + "goals/api/update/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(goal),

			onComplete: function (response) {
	        	if (response.status != 200) {
					console.error(response.status + ": " + response.text);			
				} else {
					worker.port.emit("GoalUpdated", response.json);
				}
			}
		}).put();
	}
} exports.updateGoal = updateGoal;

function deleteGoal(worker, goal) {
	if (goal != null) {
		var request = Request({
			url: api_url + "goals/api/delete/" + goal.idAsString,
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},

			onComplete: function (response) {
				if (response.status != 204) {
					console.error(response.status + ": " + response.text);			
				} else {
					worker.port.emit("GoalDeleted", response.json);
				}
			}
		}).post();
	}
} exports.deleteGoal = deleteGoal;

/////////////////////////////////////////////////////////////////////////////
// TASKS                                                                   //
/////////////////////////////////////////////////////////////////////////////

function loadTasks(worker, goalId) {
	var request = Request({
		url: api_url + "tasks/api/list/" + goalId,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json"
		},

		onComplete: function (response) {
			if (response.status != 200) {
				console.error(response.status + ": " + response.text);			
			} else {
				worker.port.emit("TasksLoaded", response.json);
			}
		}
	}).get();
} exports.loadTasks = loadTasks;

function addTask(worker, task) {
	if (task != null) {
		var request = Request({
			url: api_url + "tasks/api/create/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(task),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);			
				} else {
					worker.port.emit("TaskAdded", response.json);
				}
			}
		}).post();
	}
} exports.addTask = addTask;

function updateTask(worker, task) {
	if (task != null) {
		var request = Request({
			url: api_url + "tasks/api/update/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(task),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);			
				} else {
					worker.port.emit("TaskUpdated", response.json);
				}
			}
		}).put();
	}
} exports.updateTask = updateTask;

function deleteTask(worker, task) {
	if (task != null) {
		var request = Request({
			url: api_url + "tasks/api/delete/" + task.idAsString,
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},

			onComplete: function (response) {
				if (response.status != 204) {
					console.error(response.status + ": " + response.text);			
				} else {
					worker.port.emit("TaskDeleted", response.json);
				}
			}
		}).post();
	}
} exports.deleteTask = deleteTask;

/////////////////////////////////////////////////////////////////////////////
// NOTES                                                                   //
/////////////////////////////////////////////////////////////////////////////

function loadNotes(worker, taskId) {
	var request = Request({
		url: api_url + "notes/api/list/" + taskId,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json"
		},

		onComplete: function (response) {
			if (response.status != 200) {
				console.error(response.status + ": " + response.text);
			} else {
				worker.port.emit("NotesLoaded", response.json);
			}
		}
	}).get();
} exports.loadNotes = loadNotes;

function addNote(worker, note) {
	    console.log("Add note " + JSON.stringify(note));

	if (note != null) {
		var request = Request({
			url: api_url + "notes/api/create/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(note),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);		
				} else {
					worker.port.emit("NoteAdded", response.json); 
				}
			}
		}).post();
	}
} exports.addNote = addNote;

function updateNote(worker, note) {
	if (note != null) {
		var request = Request({
			url: api_url + "notes/api/update/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(note),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);			
				} else {
					worker.port.emit("NoteUpdated", response.json);
				}
			}
		}).put();
	}
} exports.updateNote = updateNote;

function deleteNote(worker, note) {
	var request = Request({
		url: api_url + "notes/api/delete/" + note.idAsString,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json",
			"pragma": "no-cache"
		},

		onComplete: function (response) {
			if (response.status != 204) {
				console.error(response.status + ": " + response.text);
			} else {
				worker.port.emit("NoteDeleted", response.json);
			}
		}
	}).post();
} exports.deleteNote = deleteNote;

/////////////////////////////////////////////////////////////////////////////
// BOOKMARKS                                                               //
/////////////////////////////////////////////////////////////////////////////

function loadBookmarks(worker, taskId) {
	var request = Request({
		url: api_url + "bookmarks/api/list/" + taskId,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json"
		},

		onComplete: function (response) {
			if (response.status != 200) {
				console.error(response.text);
			} else {
				worker.port.emit("BookmarksLoaded", response.json);
			}
		}
	}).get();
} exports.loadBookmarks = loadBookmarks;

function addBookmark(worker, bookmark) {
	if (bookmark != null) {
		var request = Request({
			url: api_url + "bookmarks/api/create/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(bookmark),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);
				} else {
					worker.port.emit("BookmarkAdded", response.json);
				}
			}
		}).post();
	}
} exports.addBookmark = addBookmark;

function updateBookmark(worker, bookmark) {
	if (bookmark != null) {
		var request = Request({
			url: api_url + "bookmarks/api/update/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(bookmark),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);
				} else {
					worker.port.emit("BookmarkUpdated", response.json);
				}
			}
		}).put();
	}
} exports.updateBookmark = updateBookmark;

function deleteBookmark(worker, bookmark) {
	var request = Request({
		url: api_url + "bookmarks/api/delete/" + bookmark.idAsString,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json",
			"pragma": "no-cache"
		},

		onComplete: function (response) {
			if (response.status != 204) {
				console.error(response.status + ": " + response.text);
			} else {
				worker.port.emit("BookmarkDeleted", response.json);
			}
		}
	}).post();
} exports.deleteBookmark = deleteBookmark;

/////////////////////////////////////////////////////////////////////////////
// TABS                                                                    //
/////////////////////////////////////////////////////////////////////////////

function loadTabs(worker, taskId) {
	var request = Request({
		url: api_url + "tabs/api/list/" + taskId,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json"
		},

		onComplete: function (response) {
			if (response.status != 200) {
				console.error(response.text);
			} else {
				worker.port.emit("TabsLoaded", response.json);
			}
		}
	}).get();
} exports.loadTabs = loadTabs;

function addTab(worker, tab) {
	if (tab != null) {
		var request = Request({
			url: api_url + "tabs/api/create/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(tab),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);
				} else {
					worker.port.emit("TabAdded", response.json);
				}
			}
		}).post();
	}
} exports.addTab = addTab;

function updateTab(worker, tab) {
	if (tab != null) {
		var request = Request({
			url: api_url + "tabs/api/update/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(tab),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);
				} else {
					worker.port.emit("TabUpdated", response.json);
				}
			}
		}).put();
	}
} exports.updateTab = updateTab;

function deleteTab(worker, tab) {
	if (tab != null) {
		var request = Request({
			url: api_url + "tabs/api/delete/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(tab),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);
				} else {
					worker.port.emit("TabDeleted", response.json);
				}
			}
		}).post();
	}

} exports.deleteTab = deleteTab;

function setTabs(worker, tabs) {
	if (tabs != null) {
		var request = Request({
			url: api_url + "tabs/api/set/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(tabs),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);
				} else {
					worker.port.emit("TabsLoaded", response.json);
				}
			}
		}).post();
	}
} exports.setTabs = setTabs;

/////////////////////////////////////////////////////////////////////////////
// HISTORY                                                                 //
/////////////////////////////////////////////////////////////////////////////

function loadHistories(worker, taskId) {
	var request = Request({
		url: api_url + "history/api/list/" + taskId,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json"
		},

		onComplete: function (response) {
			if (response.status != 200) {
				console.error(response.text);
			} else {
				worker.port.emit("HistoriesLoaded", response.json);
			}
		}
	}).get();
} exports.loadHistories = loadHistories;

function addHistory(worker, history) {
	if (history != null) {
		var request = Request({
			url: api_url + "history/api/create/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(history),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);
				} else {
					worker.port.emit("HistoryAdded", response.json);
				}
			}
		}).post();
	}
} exports.addHistory = addHistory;

function updateHistory(worker, history) {
	if (history != null) {
		var request = Request({
			url: api_url + "history/api/update/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: JSON.stringify(history),

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);
				} else {
					worker.port.emit("HistoryUpdated", response.json);
				}
			}
		}).put();
	}
} exports.updateHistory = updateHistory;

function deleteHistory(worker, history) {
	var request = Request({
		url: api_url + "history/api/delete/" + history.idAsString,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json",
			"pragma": "no-cache"
		},

		onComplete: function (response) {
			if (response.status != 204) {
				console.error(response.status + ": " + response.text);
			} else {
				worker.port.emit("HistoryDeleted", response.json);
			}
		}
	}).post();
} exports.deleteHistory = deleteHistory;
