const activeBrowserWindow = require("sdk/window/utils").getMostRecentBrowserWindow();
const Request = require("sdk/request").Request;
const {Cc, Ci, Cu} = require("chrome");

const api_url = "http://188.226.128.204:3000/api/v1"
//const api_url = "http://127.0.0.1:3000/api/v1"

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
  if (userId && userId !== "") {
    var request = Request({
      url: api_url + "/goal/?userId=" + userId,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },

      onComplete: function (response) {
        if (response.status != 200) {
          console.error(response.status + ": " + response.text);			
        } else {
          worker.port.emit("GoalsLoaded", response.json);
        }
      }
    }).get();
  }
} exports.loadGoals = loadGoals;

function loadGoal(worker, goalId) {
  var request = Request({
    url: api_url + "/goal/" + goalId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);			
      } else {
        worker.port.emit("GoalLoaded", response.json);
      }
    }
  }).get();
} exports.loadGoal = loadGoal;

function addGoal(worker, goal) {
  if (goal != null) {
    var request = Request({
      url: api_url + "/goal",
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
      url: api_url + "/goal",
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

function deleteGoal(worker, goalId) {
  var request = Request({
    url: api_url + "/goal/" + goalId,
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
  }).delete();
} exports.deleteGoal = deleteGoal;

/////////////////////////////////////////////////////////////////////////////
// TASKS                                                                   //
/////////////////////////////////////////////////////////////////////////////

function loadTasks(worker, goalId) {
  var request = Request({
    url: api_url + "/task/?goalId=" + goalId,
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

function loadTask(worker, taskId) {
  var request = Request({
    url: api_url + "/task/" + taskId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);			
      } else {
        worker.port.emit("TaskLoaded", response.json);
      }
    }
  }).get();
} exports.loadTask = loadTask;

function addTask(worker, task) {
  if (task != null) {
    var request = Request({
      url: api_url + "/task",
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
      url: api_url + "/task",
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

function deleteTask(worker, taskId) {
  var request = Request({
    url: api_url + "/task/" + taskId,
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
  }).delete();
} exports.deleteTask = deleteTask;

/////////////////////////////////////////////////////////////////////////////
// NOTES                                                                   //
/////////////////////////////////////////////////////////////////////////////

function loadNotes(worker, taskId) {
  var request = Request({
    url: api_url + "/note/?taskId=" + taskId,
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

function loadNote(worker, noteId) {
  var request = Request({
    url: api_url + "/note/" + noteId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);
      } else {
        worker.port.emit("NoteLoaded", response.json);
      }
    }
  }).get();
} exports.loadNote = loadNote;
  
function addNote(worker, note) {
  if (note != null) {
    var request = Request({
      url: api_url + "/note",
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
      url: api_url + "/note/",
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

function deleteNote(worker, noteId) {
  var request = Request({
    url: api_url + "/note/" + noteId,
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
  }).delete();
} exports.deleteNote = deleteNote;

/////////////////////////////////////////////////////////////////////////////
// BOOKMARKS                                                               //
/////////////////////////////////////////////////////////////////////////////

function loadBookmarks(worker, taskId) {
  var request = Request({
    url: api_url + "/bookmark/?taskId=" + taskId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);			
      } else {
        worker.port.emit("BookmarksLoaded", response.json);
      }
    }
  }).get();
} exports.loadBookmarks = loadBookmarks;

function loadBookmark(worker, bookmarkId) {
  var request = Request({
    url: api_url + "/bookmark/" + bookmarkId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);			
      } else {
        worker.port.emit("BookmarkLoaded", response.json);
      }
    }
  }).get();
} exports.loadBookmark = loadBookmark;
  
function addBookmark(worker, bookmark) {
  if (bookmark != null) {
    var request = Request({
      url: api_url + "/bookmark",
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
      url: api_url + "/bookmark",
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

function deleteBookmark(worker, bookmarkId) {
  var request = Request({
    url: api_url + "/bookmark/" + bookmarkId,
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
  }).delete();
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
} exports.getTabsFromLog = getTabsFromLog;

function addLogEntry(worker, entry) {
  if (entry != null) {
    var request = Request({
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
    }).post();
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
