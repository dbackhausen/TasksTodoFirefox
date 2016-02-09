const datastore = require("./datastore");
const utils = require("./utils");

const activeBrowserWindow = require("sdk/window/utils").getMostRecentBrowserWindow();
const Request = require("sdk/request").Request;
const {Cc, Ci, Cu} = require("chrome");

/////////////////////////////////////////////////////////////////////////////
// GOALS                                                                   //
/////////////////////////////////////////////////////////////////////////////

function loadGoals(worker) {
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
  if (taskId) {
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
    task = datastore.updateTask(task);
    worker.port.emit("TaskUpdated", task);
  }  
} exports.updateTask = updateTask;

/**
 * Deletes an existing task.
 */
function deleteTask(worker, taskId) {
  if (taskId) {
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
  if (taskId) {
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
  if (taskId) {
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
// SCREENSHOT                                                              //
/////////////////////////////////////////////////////////////////////////////

/**
 * Load screenshots regarding a certain task.
 */
function loadScreenshots(worker, taskId) {
  if (taskId != null) {
    var screenshots = datastore.readScreenshots(taskId);
    worker.port.emit("ScreenshotsLoaded", screenshots);
  }
} exports.loadScreenshots = loadScreenshots;

/**
 * Add a screenshot.
 */
function addScreenshot(worker, taskId, image) {
  if (taskId != null && image != null) {
    var screenshot = datastore.createScreenshot({
      "taskId": taskId,
      "image": image
    });
    worker.port.emit("ScreenshotAdded", screenshot);
  }
} exports.addScreenshot = addScreenshot;

/**
 * Delete a screenshot.
 */
function deleteScreenshot(worker, screenshotId) {
  if (screenshotId != null) {
    datastore.deleteScreenshot(screenshotId);
    worker.port.emit("ScreenshotDeleted");
  }
} exports.deleteScreenshot = deleteScreenshot;

/////////////////////////////////////////////////////////////////////////////
// ATTACHMENTS                                                             //
/////////////////////////////////////////////////////////////////////////////

function loadAttachments(worker, taskId) {
  
} exports.loadAttachments = loadAttachments;

function addAttachment(worker, taskId, data, filename, filetype) {
  
} exports.addAttachment = addAttachment;

function loadFileAsAttachment(worker, link) {
  
} exports.loadFileAsAttachment = loadFileAsAttachment;

function downloadAttachment(worker, attachment) {
  
} exports.downloadAttachment = downloadAttachment;

function deleteAttachment(worker, attachmentId) {
  
} exports.deleteAttachment = deleteAttachment;

/////////////////////////////////////////////////////////////////////////////
// LOG                                                                     //
/////////////////////////////////////////////////////////////////////////////

/**
 * Adds a new log entry.
 */
function addLogEntry(worker, entry) {
  if (entry != null) {
    datastore.createLogEntry(entry);
  }
} exports.addLogEntry = addLogEntry;

/**
 * Deletes a specific log entry.
 */ 
function deleteLogEntry(worker, entryId) {
  if (entryId != null) {
    datastore.deleteLogEntry(entryId);
  }
} exports.deleteLogEntry = deleteLogEntry;

/**
 * Returns the complete log.
 */
function getAllLogEntries(worker) {
  var logEntries = datastore.readLogEntries();
  worker.port.emit("LogEntriesLoaded", logEntries);
} exports.getAllLogEntries = getAllLogEntries;

/**
 * Returns the last active task from log.
 */
function getLatestGoalFromLog(worker) {
  var logEntries = datastore.readLogEntriesByAction("goal_selected");

  if (logEntries && logEntries.length > 0) {
    worker.port.emit("LatestActiveGoalLoaded", logEntries[0]);
  }
} exports.getLatestGoalFromLog = getLatestGoalFromLog;

/**
 * Returns the last active task from log.
 */
function getLatestTaskFromLog(worker) {
  var logEntries = datastore.readLogEntriesByAction("task_selected");

  if (logEntries && logEntries.length > 0) {
    worker.port.emit("LatestActiveTaskLoaded", logEntries[0]);
  }
} exports.getLatestTaskFromLog = getLatestTaskFromLog;

/**
 * Returns the complete browsing history of a given task.
 */
function getBrowsingHistory(worker, taskId) {
  if (taskId) {
    var logEntries = datastore.readLogEntriesByTask(taskId, "location_change");
    worker.port.emit("HistoryLoaded", logEntries);
  }
} exports.getBrowsingHistory = getBrowsingHistory;

/**
 * Clear the browse history of a given task.
 */
function removeBrowseHistory(worker, taskId) {
  if (taskId) {
    var logEntries = datastore.readLogEntriesByTask(taskId, "location_change");
    
    for (let entry of logEntries) {
      datastore.deleteLogEntry(entry._id);
    }
  }
} exports.removeBrowseHistory = removeBrowseHistory;

/**
 * Clear the search history of a given task.
 */
function removeSearchHistory(worker, taskId) {
  if (taskId) {
    var logEntries = datastore.readLogEntriesByTask(taskId, "search_executed");

    for (let entry of logEntries) {
      datastore.deleteLogEntry(entry._id);
    }
  }
} exports.removeSearchHistory = removeSearchHistory;

/**
 * Get all stored tabs for a given task.
 */
function getTabsFromLog(worker, taskId) {  
  if (taskId) {
    var logEntries = datastore.readLogEntriesByTask(taskId, "tab_stored");
    worker.port.emit("TabsLoaded", logEntries);
  }
} exports.getTabsFromLog = getTabsFromLog;

/**
 * Return all search queries from the log regarding a certain task.
 */
function getSearchQueriesByTask(worker, taskId) {
  if (taskId) {
    var logEntries = datastore.readLogEntriesByTask(taskId, "search_executed");
    worker.port.emit("SearchHistoryLoaded", logEntries);
  }  
} exports.getSearchQueriesByTask = getSearchQueriesByTask;

/**
 * Return all search queries from the log regarding a certain task and search provider.
 */
function getSearchQueriesByTaskAndProvider(worker, taskId, provider) {
  if (taskId != null && provider != null) {
    var logEntries = datastore.readLogEntriesByTask(taskId, "search_executed");
    var filteredLogEntries = [];
    
    for (let entry of logEntries) {
      for (let param of entry.parameters) {
        if (param.key === "provider" && param.value === provider) {
          filteredLogEntries.push(entry);
        }
      }
    }
    
    if (filteredLogEntries && filteredLogEntries.length > 0) {
      worker.port.emit("ShowLatestQueries", filteredLogEntries);
    } else {
      worker.port.emit("HideLatestQueries");
    }
  }
} exports.getSearchQueriesByTaskAndProvider = getSearchQueriesByTaskAndProvider;

/**
 * Return query suggestions from Google.com
 */
function getQuerySuggestions(worker, suggestionsProvider, searchProvider, query) {
  if (query != null && query.length > 0) {
    var q = utils.filterDuplicates(utils.filterStopwords(utils.filterIllegalCharacters(query)));
    q = q.replace(/\s\s+/g, ' '); // remove all multiple spaces
    q = encodeURIComponent(q);
    q = q.replace(/%20+/g, '+'); // replace spaces

    if (q != null && q.length > 0) {
      var url = utils.getSuggestionsUrl(suggestionsProvider) + q + "";
      console.log("Asking " + suggestionsProvider + " for suggestions via " + url);

      var request = Request({
        url: url,
        headers: {
          Accept: "text/javascript"
        },
        onComplete: function(response) {
          if (response.status == 200) {
            var arr = JSON.parse(response.text);
            var array = utils.removeStringFromArray(query, arr[1]);
            var suggestions = utils.getSuggestions(searchProvider, array);
            
            worker.port.emit("ShowQuerySuggestions", suggestions);
          } else {
            console.error(response.text);
          }
        }
      }).get(); 
    }
  }
} exports.getQuerySuggestions = getQuerySuggestions;