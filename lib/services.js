
var activeBrowserWindow = require("sdk/window/utils").getMostRecentBrowserWindow();
var {Cc, Ci} = require("chrome");
var Request = require("sdk/request").Request;

var api_url = "http://www.taskstodo.org:8080/taskstodo/"
//var api_url = "http://localhost:8080/taskstodo/"

/////////////////////////////////////////////////////////////////////////////
// USER                                                                    //
/////////////////////////////////////////////////////////////////////////////

function loginUser(worker, user) {
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

				if (response.status == 0) {
					worker.port.emit("Error", "Service unavailable!");
				} else {
					worker.port.emit("Error", "Wrong username or password!");
				}
			} else {
				worker.port.emit("UserLoggedIn", response.json);
			}
		}
	}).post();
} exports.loginUser = loginUser;

function registerUser(worker, user) {
	var request = Request({
		url: api_url + "users/api/create/",
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json",
			"pragma": "no-cache"
		},
		content: user,

		onComplete: function (response) {
        	if (response.status != 200) {
				console.error(response.status + ": " + response.text);

				if (response.status == 0) {
					worker.port.emit("Error", "Service unavailable!");
				} else {
					worker.port.emit("Error", response.text);
				}
			} else {
				worker.port.emit("UserRegistered", response.json);
			}
		}
	}).post();
} exports.registerUser = registerUser;

function sendPassword(worker, username) {
	var request = Request({
		url: api_url + "users/api/reset/",
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json",
			"pragma": "no-cache"
		},
		content: username,

		onComplete: function (response) {
        	if (response.status != 200) {
				console.error(response.status + ": " + response.text);

				if (response.status == 0) {
					worker.port.emit("Error", "Service unavailable!");
				} else {
					worker.port.emit("Error", response.text);
				}
			} else {
				worker.port.emit("PasswordReset", response.json);
			}
		}
	}).post();
} exports.sendPassword = sendPassword;

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

function loadCompletedGoals(worker, userId) {
	var request = Request({
		url: api_url + "goals/api/list/completed/" + userId,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json"
		},

		onComplete: function (response) {
			if (response.status != 200) {
				console.error(response.text);			
			} else {
				worker.port.emit("CompletedGoalsLoaded", response.json);
			}
		}
	}).get();
} exports.loadCompletedGoals = loadCompletedGoals;

function addGoal(worker, goal) {
	if (goal != null) {
		var request = Request({
			url: api_url + "goals/api/create/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: goal,

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
			content: goal,

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
			url: api_url + "goals/api/delete/" + goal.id,
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

function loadCompletedTasks(worker, goalId) {
	var request = Request({
		url: api_url + "tasks/api/list/completed/" + goalId,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json"
		},

		onComplete: function (response) {
			if (response.status != 200) {
				console.error(response.status + ": " + response.text);			
			} else {
				worker.port.emit("CompletedTasksLoaded", response.json);
			}
		}
	}).get();
} exports.loadCompletedTasks = loadCompletedTasks;

function addTask(worker, task) {
	if (task != null) {
		var request = Request({
			url: api_url + "tasks/api/create/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: task,

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
			content: task,

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
			url: api_url + "tasks/api/delete/" + task.id,
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
	if (note != null) {
		var request = Request({
			url: api_url + "notes/api/create/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: note,

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
			content: note,

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
		url: api_url + "notes/api/delete/" + note.id,
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
			content: bookmark,

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
			content: bookmark,

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
		url: api_url + "bookmarks/api/delete/" + bookmark.id,
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
// HISTORY                                                                 //
/////////////////////////////////////////////////////////////////////////////

function loadHistory(worker, taskId) {
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
				worker.port.emit("HistoryLoaded", response.json);
			}
		}
	}).get();
} exports.loadHistory = loadHistory;

function addHistoryEntry(worker, historyEntry) {
	if (historyEntry != null) {
		var request = Request({
			url: api_url + "history/api/create/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: historyEntry,

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);
				} else {
					worker.port.emit("HistoryEntryAdded", response.json);
				}
			}
		}).post();
	}
} exports.addHistoryEntry = addHistoryEntry;

function updateHistoryEntry(worker, historyEntry) {
	if (historyEntry != null) {
		var request = Request({
			url: api_url + "history/api/update/",
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: historyEntry,

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);
				} else {
					worker.port.emit("HistoryEntryUpdated", response.json);
				}
			}
		}).put();
	}
} exports.updateHistoryEntry = updateHistoryEntry;

function deleteHistoryEntry(worker, historyEntry) {
	var request = Request({
		url: api_url + "history/api/delete/" + historyEntry.id,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json",
			"pragma": "no-cache"
		},

		onComplete: function (response) {
			if (response.status != 204) {
				console.error(response.status + ": " + response.text);
			} else {
				worker.port.emit("HistoryEntryDeleted", response.json);
			}
		}
	}).post();
} exports.deleteHistoryEntry = deleteHistoryEntry;

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
			content: tab,

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
			content: tab,

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
			url: api_url + "tabs/api/delete/" + tab.id,
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},

			onComplete: function (response) {
				if (response.status != 204) {
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
// ATTACHMENTS                                                             //
/////////////////////////////////////////////////////////////////////////////

function loadAttachments(worker, taskId) {
	var request = Request({
		url: api_url + "attachments/api/list/" + taskId,
		headers: {
			"Accept": "application/json",
            "Content-Type": "application/json"
		},

		onComplete: function (response) {
			if (response.status != 200) {
				console.error(response.text);
			} else {
				worker.port.emit("AttachmentsLoaded", response.json);
			}
		}
	}).get();
} exports.loadAttachments = loadAttachments;


function addAttachment(worker, taskId, data, filename, filetype) {
	if (data != null) {
	    var boundary = '---------------------------';
		boundary += Math.floor(Math.random()*32768);
		boundary += Math.floor(Math.random()*32768);
		boundary += Math.floor(Math.random()*32768);

		var body = "--" + boundary + "\r\n";
		body += 'Content-Disposition: form-data; name="file"; filename="' + unescape(encodeURIComponent(filename)) + '"\r\n';
		body += 'Content-Type: ' + filetype + '\r\n\r\n';
		body += data + '\r\n';
		body += '--' + boundary + '--';

		var request = Request({
			url: api_url + "attachments/api/create/" + taskId,
			headers: {
			  "Content-Type": "multipart/form-data;boundary=" + boundary
			},
			content: body,

			onComplete: function (response) {
				if (response.status != 200) {
					console.error(response.status + ": " + response.text);
				} else {
					worker.port.emit("AttachmentAdded", response.json);
				}
			}
		}).post();
	}
} exports.addAttachment = addAttachment;

function deleteAttachment(worker, attachmentId) {
	        console.log("Deleting attachment " + attachmentId);

	if (attachmentId != null) {
		var request = Request({
			url: api_url + "attachments/api/delete/" + attachmentId,
			headers: {
				"Accept": "application/json",
	            "Content-Type": "application/json",
				"pragma": "no-cache"
			},

			onComplete: function (response) {
				if (response.status != 204) {
					console.error(response.status + ": " + response.text);
				} else {
					worker.port.emit("AttachmentDeleted", response.json);
				}
			}
		}).post();
	}

} exports.deleteAttachment = deleteAttachment;

