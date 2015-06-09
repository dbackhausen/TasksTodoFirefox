const activeBrowserWindow = require("sdk/window/utils").getMostRecentBrowserWindow();
const Request = require("sdk/request").Request;
const {Cc, Ci, Cu} = require("chrome");

const api_url = "http://188.226.128.204:3000"
//const api_url = "http://127.0.0.1:3000"

/////////////////////////////////////////////////////////////////////////////
// USER                                                                    //
/////////////////////////////////////////////////////////////////////////////

function updateUser(worker, user) {
  var request = Request({
    url: api_url + "/users",
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
} exports.updateUser = updateUser;

function loginUser(worker, user) {
  var request = Request({
    url: api_url + "/users/login",
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
          worker.port.emit("Error", "Wrong username or password!");
        }
      } else {
        worker.port.emit("UserLoggedIn", JSON.stringify(response.json[0]));
      }
    }
  }).post();
} exports.loginUser = loginUser;

function registerUser(worker, user) {
  var request = Request({
    url: api_url + "/users",
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
        worker.port.emit("UserRegistered", response.json);
      }
    }
  }).post();
} exports.registerUser = registerUser;

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
	console.log("Loading goals for user ID " + userId);

	var request = Request({
		url: api_url + "/goals/user/" + userId,
		headers: {
			"Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
		},

		onComplete: function (response) {
			if (response.status != 200) {
			//	console.error(response.text);			
			} else {
				worker.port.emit("GoalsLoaded", response.json);
			}
		}
	}).get();
} exports.loadGoals = loadGoals;

function addGoal(worker, goal) {
	if (goal != null) {
		var request = Request({
			url: api_url + "/goals",
			headers: {
				"Accept": "application/json",
        "Content-Type": "application/json",
				"pragma": "no-cache"
			},
			content: goal,

			onComplete: function (response) {
				if (response.status != 200) {
				//	console.error(response.status + ": " + response.text);			
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
      url: api_url + "/goals/" + JSON.parse(goal)._id,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },
      content: goal,

      onComplete: function (response) {
        if (response.status != 200) {
          // console.error(response.status + ": " + response.text);			
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
      url: api_url + "/goals/" + JSON.parse(goal)._id,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },

      onComplete: function (response) {
        if (response.status != 204) {
          // console.error(response.status + ": " + response.text);			
        } else {
          worker.port.emit("GoalDeleted", response.json);
        }
      }
    }).delete();
  }
} exports.deleteGoal = deleteGoal;

/////////////////////////////////////////////////////////////////////////////
// TASKS                                                                   //
/////////////////////////////////////////////////////////////////////////////

function loadTasks(worker, goalId) {
  console.log("Loading tasks for goal ID " + goalId);

  var request = Request({
    url: api_url + "/tasks/goal/" + goalId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        // console.error(response.status + ": " + response.text);			
      } else {
        worker.port.emit("TasksLoaded", response.json);
      }
    }
  }).get();
} exports.loadTasks = loadTasks;

function addTask(worker, task) {
  if (task != null) {
    var request = Request({
      url: api_url + "/tasks",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },
      content: task,

      onComplete: function (response) {
      if (response.status != 200) {
        // console.error(response.status + ": " + response.text);			
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
      url: api_url + "/tasks/" + JSON.parse(task)._id,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },
      content: task,

      onComplete: function (response) {
        if (response.status != 200) {
          // console.error(response.status + ": " + response.text);			
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
      url: api_url + "/tasks/" + JSON.parse(task)._id,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },

      onComplete: function (response) {
        if (response.status != 204) {
          // console.error(response.status + ": " + response.text);			
        } else {
          worker.port.emit("TaskDeleted", response.json);
        }
      }
    }).delete();
  }
} exports.deleteTask = deleteTask;

/////////////////////////////////////////////////////////////////////////////
// NOTES                                                                   //
/////////////////////////////////////////////////////////////////////////////

function loadNotes(worker, taskId) {
  var request = Request({
    url: api_url + "/notes/task/" + taskId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        // console.error(response.status + ": " + response.text);
      } else {
        worker.port.emit("NotesLoaded", response.json);
      }
    }
  }).get();
} exports.loadNotes = loadNotes;

function addNote(worker, note) {
  if (note != null) {
    var request = Request({
      url: api_url + "/notes",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },
      content: note,

      onComplete: function (response) {
        if (response.status != 200) {
          // console.error(response.status + ": " + response.text);		
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
      url: api_url + "/notes/" + JSON.parse(note)._id,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },
      content: note,

      onComplete: function (response) {
        if (response.status != 200) {
          // console.error(response.status + ": " + response.text);			
        } else {
          worker.port.emit("NoteUpdated", response.json);
        }
      }
    }).put();
  }
} exports.updateNote = updateNote;

function deleteNote(worker, note) {
  var request = Request({
    url: api_url + "/notes/" + JSON.parse(note)._id,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },

    onComplete: function (response) {
      if (response.status != 204) {
        // console.error(response.status + ": " + response.text);
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
		url: api_url + "/bookmarks/task/" + taskId,
		headers: {
			"Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
		},

		onComplete: function (response) {
			if (response.status != 200) {
              // console.error(response.text);
			} else {
              worker.port.emit("BookmarksLoaded", response.json);
			}
		}
	}).get();
} exports.loadBookmarks = loadBookmarks;

function addBookmark(worker, bookmark) {
  if (bookmark != null) {
    var request = Request({
      url: api_url + "/bookmarks",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },
      content: bookmark,

      onComplete: function (response) {
        if (response.status != 200) {
          // console.error(response.status + ": " + response.text);
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
      url: api_url + "/bookmarks/" + JSON.parse(bookmark)._id,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },
      content: bookmark,

      onComplete: function (response) {
        if (response.status != 200) {
          // console.error(response.status + ": " + response.text);
        } else {
          worker.port.emit("BookmarkUpdated", response.json);
        }
      }
    }).put();
  }
} exports.updateBookmark = updateBookmark;

function deleteBookmark(worker, bookmark) {
  var request = Request({
    url: api_url + "/bookmarks/" + JSON.parse(bookmark)._id,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },

    onComplete: function (response) {
      if (response.status != 204) {
        // console.error(response.status + ": " + response.text);
      } else {
        worker.port.emit("BookmarkDeleted", response.json);
      }
    }
  }).delete();
} exports.deleteBookmark = deleteBookmark;

/////////////////////////////////////////////////////////////////////////////
// TABS                                                                    //
/////////////////////////////////////////////////////////////////////////////

// function loadTabs(worker, taskId) {
// 	var request = Request({
// 		url: api_url + "/tabs/task/" + taskId,
// 		headers: {
// 			"Accept": "application/json",
//       "Content-Type": "application/json",
//       "pragma": "no-cache"
// 		},

// 		onComplete: function (response) {
// 			if (response.status != 200) {
// 			//	console.error(response.text);
// 			} else {
// 				worker.port.emit("TabsLoaded", response.json);
// 			}
// 		}
// 	}).get();
// } exports.loadTabs = loadTabs;

// function addTab(worker, tab) {
// 	if (tab != null) {
// 		var request = Request({
// 			url: api_url + "/tabs",
// 			headers: {
// 				"Accept": "application/json",
//         "Content-Type": "application/json",
// 				"pragma": "no-cache"
// 			},
// 			content: tab,

// 			onComplete: function (response) {
// 				if (response.status != 200) {
// 				//	console.error(response.status + ": " + response.text);
// 				} else {
// 					worker.port.emit("TabAdded", response.json);
// 				}
// 			}
// 		}).post();
// 	}
// } exports.addTab = addTab;

// function updateTab(worker, tab) {
// 	if (tab != null) {
// 		var request = Request({
// 			url: api_url + "/tabs/" + JSON.parse(tab)._id,
// 			headers: {
// 				"Accept": "application/json",
//         "Content-Type": "application/json",
// 				"pragma": "no-cache"
// 			},
// 			content: tab,

// 			onComplete: function (response) {
// 				if (response.status != 200) {
// 				//	console.error(response.status + ": " + response.text);
// 				} else {
// 					worker.port.emit("TabUpdated", response.json);
// 				}
// 			}
// 		}).put();
// 	}
// } exports.updateTab = updateTab;

// function deleteTab(worker, tab) {
// 	if (tab != null) {
// 		var request = Request({
// 			url: api_url + "/tabs/" + JSON.parse(tab)._id,
// 			headers: {
// 				"Accept": "application/json",
//         "Content-Type": "application/json",
// 				"pragma": "no-cache"
// 			},

// 			onComplete: function (response) {
// 				if (response.status != 204) {
// 				//	console.error(response.status + ": " + response.text);
// 				} else {
// 					worker.port.emit("TabDeleted", response.json);
// 				}
// 			}
// 		}).delete();
// 	}
// } exports.deleteTab = deleteTab;

/////////////////////////////////////////////////////////////////////////////
// ATTACHMENTS                                                             //
/////////////////////////////////////////////////////////////////////////////

function loadAttachments(worker, taskId) {
  var request = Request({
    url: api_url + "/attachments/task/" + taskId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        // console.error(response.text);
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
      url: api_url + "/attachments/" + taskId,
      headers: {
        "Content-Type": "multipart/form-data;boundary=" + boundary
      },
      content: body,

      onComplete: function (response) {
        if (response.status != 200) {
          // console.error(response.status + ": " + response.text);
        } else {
          worker.port.emit("AttachmentAdded", response.json);
        }
      }
    }).post();
  }
} exports.addAttachment = addAttachment;

function downloadAttachment(worker, attachment) {
  if (attachment != null && attachment.filename != null) {      
    Cu.import("resource://gre/modules/Downloads.jsm");
    Cu.import("resource://gre/modules/Services.jsm");
    Cu.import("resource://gre/modules/osfile.jsm")
    Cu.import("resource://gre/modules/Task.jsm");

    var targetFile = Services.dirsvc.get("Desk", Ci.nsIFile);
    targetFile.append(attachment.filename);

    var url = api_url + "/attachments/" + attachment._id;
    var sourceUri = Services.io.newURI(url, null, null);
    console.log("Downloading attachment " + attachment.filename + " from URL " + url);

//      var persist = Cc["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(Ci.nsIWebBrowserPersist);
//      persist.persistFlags = persist.PERSIST_FLAGS_FROM_CACHE
//                           | persist.PERSIST_FLAGS_REPLACE_EXISTING_FILES;

    Task.spawn(function () {
      yield Downloads.fetch(url, OS.Path.join(OS.Constants.Path.desktopDir, attachment.filename));
      console.log(attachment.filename + " has been downloaded.");
    }).then(null, Cu.reportError);
  }
} exports.downloadAttachment = downloadAttachment;

function deleteAttachment(worker, attachmentId) {
  if (attachmentId != null) {
    var request = Request({
      url: api_url + "/attachments/" + attachmentId,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "pragma": "no-cache"
      },

      onComplete: function (response) {
        if (response.status != 204) {
          // console.error(response.status + ": " + response.text);
        } else {
          worker.port.emit("AttachmentDeleted", response.json);
        }
      }
    }).delete();
  }
} exports.deleteAttachment = deleteAttachment;

/////////////////////////////////////////////////////////////////////////////
// HISTORY                                                                 //
/////////////////////////////////////////////////////////////////////////////

// var main = require("./main");

// function loadQueries(worker, taskId, engine) {
// 	if (taskId && engine) {
// 		var request = Request({
// 			url: api_url + "/log/task/" + taskId + "/" + engine,
// 			headers: {
// 				"Accept": "application/json",
//         "Content-Type": "application/json",
//         "pragma": "no-cache"
// 			},

// 			onComplete: function (response) {
// 				if (response.status != 200) {
// 					console.error(response.status + ": " + response.text);
// 				} else {
// 					console.log(JSON.stringify(response.json));
// 					worker.port.emit("QueriesLoaded", response.json);
// 					main.showLatestQueries(taskId, response.json);
// 				}
// 			}
// 		}).get();
// 	}
// } exports.loadQueries = loadQueries;

/////////////////////////////////////////////////////////////////////////////
// LOG                                                                     //
/////////////////////////////////////////////////////////////////////////////

function loadLogEntries(worker, userId) {
  var request = Request({
    url: api_url + "/log/user/" + userId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);
      } else {
      }
    }
  }).get();
} exports.loadLogEntries = loadLogEntries;

function getLatestQueriesFromLog(worker, logQuery) {
  var request = Request({
    url: api_url + "/log/latestqueries/",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },
    content: JSON.stringify(logQuery),

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
  }).post();
} exports.getLatestQueriesFromLog = getLatestQueriesFromLog;

function addLogEntry(worker, entry) {
  var request = Request({
    url: api_url + "/log/",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },
    content: JSON.stringify(entry),

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);
      } else {
      }
    }
  }).post();
} exports.addLogEntry = addLogEntry;

function updateLogEntry(worker, entry) {
  var request = Request({
    url: api_url + "/log/" + JSON.parse(entry)._id,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },
    content: entry,

    onComplete: function (response) {
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);
      } else {
      }
    }
  }).put();
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
      if (response.status != 200) {
        console.error(response.status + ": " + response.text);
      } else {
      }
    }
  }).delete();
} exports.deleteLogEntry = deleteLogEntry;

// --

function loadHistory(worker, taskId) {
  var request = Request({
    url: api_url + "/log/history/" + taskId,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "pragma": "no-cache"
    },

    onComplete: function (response) {
      if (response.status != 200) {
        // console.error(response.text);
      } else {
        worker.port.emit("HistoryLoaded", response.json);
      }
    }
  }).get();
} exports.loadHistory = loadHistory;
