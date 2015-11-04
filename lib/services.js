const datastore = require("./datastore");

const activeBrowserWindow = require("sdk/window/utils").getMostRecentBrowserWindow();
const Request = require("sdk/request").Request;
const {Cc, Ci, Cu} = require("chrome");

//const api_url = "http://188.226.128.204:3000/api/v1"
const api_url = "http://127.0.0.1:3000/api/v1"

/////////////////////////////////////////////////////////////////////////////
// USER                                                                    //
/////////////////////////////////////////////////////////////////////////////

function loginUser(worker, user) {
  var request = Request({
    url: api_url + "/login",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },
    content: user,

    onComplete: function (response) {
      if (response.status != 200) {
        if (response.status == 0) {
          worker.port.emit("Error", "Service unavailable!");
        } else {
          worker.port.emit("Error", "Unknown user");
        }
      } else {
        worker.port.emit("UserLoggedIn", JSON.stringify(response.json));
      }
    }
  }).post();
} exports.loginUser = loginUser;

function createUser(worker, user) {
  if (user != null) {
    var request = Request({
      url: api_url + "/user",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },
      content: user,

      onComplete: function (response) {
        if (response.status != 200) {		
          if (response.status == 0) {
            worker.port.emit("Error", "Service unavailable!");
          } else if (response.status == 409) {
            worker.port.emit("UserAlreadyExists");            
          } else {
            worker.port.emit("Error", response.text);
          }
        } else {
          worker.port.emit("UserRegistered", response.json);
        }
      }
    }).post();
  }
} exports.createUser = createUser;

function updateUser(worker, user) {
  if (user != null) {
    var request = Request({
      url: api_url + "/user",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },
      content: user,

      onComplete: function (response) {
        if (response.status != 200) {
          if (response.status == 0) {
            worker.port.emit("Error", "Service unavailable!");
          } else {
            worker.port.emit("Error", response.text);
          }
        } else {
          worker.port.emit("UserUpdated", response.json);
        }
      }
    }).put();
  }
} exports.updateUser = updateUser;

function deleteUser(worker, userId) {
  var request = Request({
    url: api_url + "/user/" + userId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },

    onComplete: function (response) {
      if (response.status != 204) {
        console.error(response.status + ": " + response.text);			
      } else {
        worker.port.emit("UserDeleted", response.json);
      }
    }
  }).delete();
} exports.deleteUser = deleteUser;

function sendPassword(worker, username) {
/*	var request = Request({
		url: api_url + "/users/api/reset/",
		headers: {
			"Accept": "application/json",
      "Content-Type": "application/json",
			"pragma": "no-cache"
		},
		content: username,

		onComplete: function (response) {
    	if (response.status != 200) {
				if (response.status == 0) {
					worker.port.emit("Error", "Service unavailable!");
				} else {
					worker.port.emit("Error", response.text);
				}
			} else {
				worker.port.emit("PasswordReset", response.json);
			}
		}
	}).post();*/
} exports.sendPassword = sendPassword;

/////////////////////////////////////////////////////////////////////////////
// GOALS                                                                   //
/////////////////////////////////////////////////////////////////////////////

function loadGoals(worker, userId) {
  var goals = datastore.readGoals();
  worker.port.emit("GoalsLoaded", goals);  
} exports.loadGoals = loadGoals;

/**
 * Loads a specific goal.
 */
function loadGoal(worker, goalId) {
  if (goalId != null) {
    var goal = datastore.readGoal(goalId);
    worker.port.emit("GoalLoaded", goal);
  }
} exports.loadGoal = loadGoal;

/**
 * Adds a new goal.
 */
function addGoal(worker, goal) {
  if (goal != null) {
    goal = datastore.createGoal(goal);
    worker.port.emit("GoalAdded", goal);
  }
} exports.addGoal = addGoal;

/**
 * Updates an existing goal.
 */
function updateGoal(worker, goal) {
  if (goal != null) {
    goal = datastore.updateGoal(goal);
    worker.port.emit("GoalUpdated", goal);
  }  
} exports.updateGoal = updateGoal;

/**
 * Deletes an existing goal.
 */
function deleteGoal(worker, goalId) {
  if (goalId != null) {
    datastore.deleteGoal(goalId);
    worker.port.emit("GoalDeleted", goalId);
  }
} exports.deleteGoal = deleteGoal;

/////////////////////////////////////////////////////////////////////////////
// TASKS                                                                   //
/////////////////////////////////////////////////////////////////////////////

/**
 * Loads all tasks of a specific goal.
 */
function loadTasks(worker, goalId) {
  if (goalId != null) {
    var tasks = datastore.readTasks(goalId);
    worker.port.emit("TasksLoaded", tasks);  
  }
} exports.loadTasks = loadTasks;

/**
 * Loads a specific task.
 */
function loadTask(worker, taskId) {
  if (taskId != null) {
    var task = datastore.readTask(taskId);
    worker.port.emit("TaskLoaded", task);
  }
} exports.loadTask = loadTask;

/**
 * Adds a new task.
 */
function addTask(worker, task) {
  if (task != null) {
    task = datastore.createTask(task);
    worker.port.emit("TaskAdded", task);
  }
} exports.addTask = addTask;

/**
 * Updates an existing task.
 */
function updateTask(worker, task) {
  if (task != null) {
    console.log("> " + JSON.stringify(task));
    task = datastore.updateTask(task);
    worker.port.emit("TaskUpdated", task);
  }  
} exports.updateTask = updateTask;

/**
 * Deletes an existing task.
 */
function deleteTask(worker, taskId) {
  if (taskId != null) {
    datastore.deleteTask(taskId);
    worker.port.emit("TaskDeleted", taskId);
  }
} exports.deleteTask = deleteTask;

/////////////////////////////////////////////////////////////////////////////
// NOTES                                                                   //
/////////////////////////////////////////////////////////////////////////////

/**
 * Loads all notes of a specific task.
 */
function loadNotes(worker, taskId) {
  if (taskId != null) {
    var notes = datastore.readNotes(taskId);
    worker.port.emit("NotesLoaded", notes);  
  }
} exports.loadNotes = loadNotes;

/**
 * Loads a specific note.
 */
function loadNote(worker, noteId) {
  if (noteId != null) {
    var note = datastore.readNote(noteId);
    worker.port.emit("NoteLoaded", note);  
  }
} exports.loadNote = loadNote;

/**
 * Adds a new note.
 */
function addNote(worker, note) {
  if (note != null) {
    note = datastore.createNote(note);
    worker.port.emit("NoteAdded", note);
  }
} exports.addNote = addNote;

/**
 * Updates an existing note.
 */
function updateNote(worker, note) {
  if (note != null) {
    note = datastore.updateNote(note);
    worker.port.emit("NoteUpdated", note);
  }  
} exports.updateNote = updateNote;

/**
 * Deletes an existing note.
 */
function deleteNote(worker, noteId) {
  if (noteId != null) {
    datastore.deleteNote(noteId);
    worker.port.emit("NoteDeleted", noteId);
  }
} exports.deleteNote = deleteNote;

/////////////////////////////////////////////////////////////////////////////
// BOOKMARKS                                                               //
/////////////////////////////////////////////////////////////////////////////

/**
 * Loads all bookmarks of a specific task.
 */
function loadBookmarks(worker, taskId) {
  if (taskId != null) {
    var bookmarks = datastore.readBookmarks(taskId);
    worker.port.emit("BookmarksLoaded", bookmarks);  
  }
} exports.loadBookmarks = loadBookmarks;

/**
 * Loads a specific bookmark.
 */
function loadBookmark(worker, bookmarkId) {
  if (bookmarkId != null) {
    var bookmark = datastore.readBookmark(bookmarkId);
    worker.port.emit("BookmarkLoaded", bookmark);  
  }
} exports.loadBookmark = loadBookmark;

/**
 * Adds a new bookmark.
 */
function addBookmark(worker, bookmark) {
  if (bookmark != null) {
    bookmark = datastore.createBookmark(bookmark);
    worker.port.emit("BookmarkAdded", bookmark);
  }
} exports.addBookmark = addBookmark;

/**
 * Updates an existing bookmark.
 */
function updateBookmark(worker, bookmark) {
  if (bookmark != null) {
    bookmark = datastore.updateBookmark(bookmark);
    worker.port.emit("BookmarkUpdated", bookmark);
  }  
} exports.updateBookmark = updateBookmark;

/**
 * Deletes an existing bookmark.
 */
function deleteBookmark(worker, bookmarkId) {
  if (bookmarkId != null) {
    datastore.deleteBookmark(bookmarkId);
    worker.port.emit("BookmarkDeleted", bookmarkId);
  }
} exports.deleteBookmark = deleteBookmark;

/////////////////////////////////////////////////////////////////////////////
// ATTACHMENTS                                                             //
/////////////////////////////////////////////////////////////////////////////

function loadAttachments(worker, taskId) {
  var request = Request({
    url: api_url + "/attachment/?taskId=" + taskId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);			
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
      url: api_url + "/attachment/" + taskId,
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

function loadFileAsAttachment(worker, link) {
  if (link != null) {
    var request = Request({
      url: api_url + "/attachment/link/" + JSON.parse(link).taskId,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },
      content: link,

      onComplete: function (response) {
        if (response.status != 200) {
          console.error(response.status + ": " + response.text);
        }
      }
    }).post();
  }
} exports.loadFileAsAttachment = loadFileAsAttachment;

function downloadAttachment(worker, attachment) {
  if (attachment != null && attachment.filename != null) {      
    Cu.import("resource://gre/modules/Downloads.jsm");
    Cu.import("resource://gre/modules/Services.jsm");
    Cu.import("resource://gre/modules/osfile.jsm")
    Cu.import("resource://gre/modules/Task.jsm");

    var targetFile = Services.dirsvc.get("Desk", Ci.nsIFile);
    targetFile.append(attachment.filename);

    var url = api_url + "/attachment/" + attachment._id;
    var sourceUri = Services.io.newURI(url, null, null);

    Task.spawn(function () {
      yield Downloads.fetch(url, OS.Path.join(OS.Constants.Path.desktopDir, attachment.filename));
    }).then(null, Cu.reportError);
  }
} exports.downloadAttachment = downloadAttachment;

function deleteAttachment(worker, attachmentId) {
  var request = Request({
    url: api_url + "/attachment/" + attachmentId,
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
  }).delete();
} exports.deleteAttachment = deleteAttachment;

/////////////////////////////////////////////////////////////////////////////
// LOG                                                                     //
/////////////////////////////////////////////////////////////////////////////

function getLogEntriesByUser(worker, userId) {
  var request = Request({
    url: api_url + "/log/?userId=" + userId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);
      } else {
        // What to do with the data?
      }
    }
  }).get();
} exports.getLogEntriesByUser = getLogEntriesByUser;

function getLogEntriesByTask(worker, taskId) {
  var request = Request({
    url: api_url + "/log/?taskId=" + taskId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);
      } else {
        // What to do with the data?
      }
    }
  }).get();
} exports.getLogEntriesByTask = getLogEntriesByTask;

function getLogEntriesByUserAndTask(worker, userId, taskId) {
  var request = Request({
    url: api_url + "/log/?userId=" + userId + "&taskId=" + taskId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);
      } else {
        // What to do with the data?
      }
    }
  }).get();
} exports.getLogEntriesByUserAndTask = getLogEntriesByUserAndTask;

function getLatestTaskFromLog(worker, userId) {
  var request = Request({
    url: api_url + "/log/?userId=" + userId + "&action=task_selected&limit=1",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);
      } else {
        worker.port.emit("LatestActiveTaskLoaded", response.json[0]);
      }
    }
  }).get();
} exports.getLatestTaskFromLog = getLatestTaskFromLog;

function getBrowseHistoryFromTask(worker, taskId) {
  var request = Request({
    url: api_url + "/log/?taskId=" + taskId + "&action=location_change&limit=20",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);			
      } else {
        worker.port.emit("HistoryLoaded", response.json);
      }
    }
  }).get();
} exports.getBrowseHistoryFromTask = getBrowseHistoryFromTask;

function getAllQueriesFromLog(worker, taskId) {
  var request = Request({
    url: api_url + "/log/?taskId=" + taskId + "&action=search_executed&limit=20",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    
    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);
      } else {
        worker.port.emit("SearchHistoryLoaded", response.json);           
      }
    }
  }).get();
} exports.getAllQueriesFromLog = getAllQueriesFromLog;

function getQueriesFromLogByProvider(worker, taskId, provider) {
  var request = Request({
    url: api_url + "/log/?taskId=" + taskId + "&action=search_executed&limit=5&key=provider&value=" + provider,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    
    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);
      } else {
        if (response.json != null && response.json.length > 0) {
          worker.port.emit("ShowLatestQueries", response.json);
        } else {
          worker.port.emit("HideLatestQueries");              
        }
      }
    }
  }).get();
} exports.getQueriesFromLogByProvider = getQueriesFromLogByProvider;

function getTabsFromLog(worker, taskId) {  
  /*
  var request = Request({
    url: api_url + "/log/?taskId=" + taskId + "&action=tab_stored",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);
      } else {
        worker.port.emit("TabsLoaded", response.json);
      }
    }
  }).get();
  */
  
  
  logEntries = datastore.readLogEntries(taskId, "tab_stored");
  worker.port.emit("TabsLoaded", logEntries);
  
} exports.getTabsFromLog = getTabsFromLog;

function addLogEntry(worker, entry) {
  if (entry != null) {
    /*var request = Request({
      url: api_url + "/log",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },
      content: JSON.stringify(entry),

      onComplete: function (response) {
        if (response.status != 200) {
          console.error(response.status + ": " + response.text);
        }
      }
    }).post();*/
    
    datastore.createLogEntry(entry);
    
    
  }
} exports.addLogEntry = addLogEntry;

function updateLogEntry(worker, entry) {
  if (entry != null) {
    var request = Request({
      url: api_url + "/log",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },
      content: entry,

      onComplete: function (response) {
        if (response.status != 200) {
          console.error(response.status + ": " + response.text);
        }
      }
    }).put();
  }
} exports.updateLogEntry = updateLogEntry;

function deleteLogEntry(worker, entryId) {
  var request = Request({
    url: api_url + "/log/" + entryId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },

    onComplete: function (response) {
      if (response.status != 204) {
        console.error(response.status + ": " + response.text);
      } else {
        worker.port.emit("LogEntryDeleted", response.json);
      }
    }
  }).delete();
} exports.deleteLogEntry = deleteLogEntry;

function clearHistory(worker, taskId) {
  var request = Request({
    url: api_url + "/clear/log?taskId=" + taskId + "&action=location_change",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },

    onComplete: function (response) {
      if (response.status != 204) {
        console.error(response.status + ": " + response.text);			
      } else {
        worker.port.emit("HistoryCleared", response.json);
      }
    }
  }).delete();
} exports.clearHistory = clearHistory;
