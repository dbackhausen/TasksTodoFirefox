var {Cc, Ci, Cu} = require("chrome");
var {Services} = Cu.import("resource://gre/modules/Services.jsm");
var {FileUtils} = Cu.import("resource://gre/modules/FileUtils.jsm");

var dbExists = true;
var dbConn = null;

// Trigger initialization on add-on startup!
initialize();

/**
 * Initialize a database, a connection and all tables (if necessary).
 */
function initialize() {
  console.log("Initializing local datastore");
  
  let dbFile = FileUtils.getFile("Home", ["taskstodo.sqlite"]); // ProfD = Profile Directory
  dbExists = dbFile.exists();
  dbConn = Services.storage.openDatabase(dbFile);
    
  if (!dbExists) {
    
    /*
     * Cascading delete isn't supported until Sqlite version 3.6.19!
     */
     
    try {
      // Create a table for the goals
      dbConn.executeSimpleSQL("CREATE TABLE goals (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, due_date TEXT DEFAULT NULL, priority INTEGER DEFAULT 0, position INTEGER DEFAULT 0, level INTEGER DEFAULT 0, completed TEXT DEFAULT NULL, created TEXT, modified TEXT)");
      
      // Create a table for the goals
      dbConn.executeSimpleSQL("CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, goal INTEGER REFERENCES goals(id) ON DELETE CASCADE, title TEXT, due_date TEXT DEFAULT NULL, priority INTEGER DEFAULT 0, position INTEGER DEFAULT 0, level INTEGER DEFAULT 0, completed TEXT DEFAULT NULL, created TEXT, modified TEXT)");
      dbConn.executeSimpleSQL("CREATE INDEX goalindex ON tasks(goal)");
      
      // Create a table for the notes
      dbConn.executeSimpleSQL("CREATE TABLE notes (id INTEGER PRIMARY KEY AUTOINCREMENT, task INTEGER REFERENCES tasks(id) ON DELETE CASCADE, body TEXT, created TEXT, modified TEXT)");
      dbConn.executeSimpleSQL("CREATE INDEX notestaskindex ON notes(task)");
      
      // Create a table for the bookmarks
      dbConn.executeSimpleSQL("CREATE TABLE bookmarks (id INTEGER PRIMARY KEY AUTOINCREMENT, task INTEGER REFERENCES tasks(id) ON DELETE CASCADE, title TEXT, url TEXT, description TEXT, thumbnail BLOB, content BLOB, created TEXT, modified TEXT)");
      dbConn.executeSimpleSQL("CREATE INDEX bookmarkstaskindex ON bookmarks(task)");
      
      // Create a tables for the logging
      dbConn.executeSimpleSQL("CREATE TABLE logentries (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT, created TEXT)");
      dbConn.executeSimpleSQL("CREATE INDEX actionindex ON logentries(action)");

      dbConn.executeSimpleSQL("CREATE TABLE logparams (id INTEGER PRIMARY KEY AUTOINCREMENT, logentry INTEGER REFERENCES logentries(id) ON DELETE CASCADE, key TEXT, value TEXT, created TEXT)");
      dbConn.executeSimpleSQL("CREATE INDEX entryindex ON logparams(logentry)");
      
      // Create a table for the screenshots
      dbConn.executeSimpleSQL("CREATE TABLE screenshots (id INTEGER PRIMARY KEY AUTOINCREMENT, task INTEGER REFERENCES tasks(id) ON DELETE CASCADE, screenshot BLOB, created TEXT, modified TEXT)");
      dbConn.executeSimpleSQL("CREATE INDEX screenshotstaskindex ON screenshots(task)");
    } catch (ex) {
      console.error(ex);
    }
    
    console.log("Database tables successfully created");
  }
}


/////////////////////////////////////////////////////////////////////////////
// GOALS                                                                   //
/////////////////////////////////////////////////////////////////////////////


/**
 * Load all goals.
 */
exports.readGoals = function readGoals() {
  var stmt = dbConn.createStatement("SELECT * FROM goals WHERE 1 ORDER BY position ASC");
  var results = [];
    
  try {
    while (stmt.executeStep()) {
      results.push({
        _id: stmt.row.id,
        title: stmt.row.title,
        dueDate: stmt.row.due_date,
        priority: stmt.row.priority,
        position: stmt.row.position,
        level: stmt.row.level,
        completed: stmt.row.completed,
        created: stmt.row.created,
        modified: stmt.row.modified
      });
    }    
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return results;
}

/**
 * Load a specific goal.
 */
exports.readGoal = function readGoal(goalId) {
  var stmt = dbConn.createStatement("SELECT * FROM goals WHERE id = :goalId");
  var goal = null;
  
  try {
    stmt.params.goalId = goalId;
  
    while (stmt.executeStep()) {
      goal = {
        _id: stmt.row.id,
        title: stmt.row.title,
        dueDate: stmt.row.due_date,
        priority: stmt.row.priority,
        position: stmt.row.position,
        level: stmt.row.level,
        completed: stmt.row.completed,
        created: stmt.row.created,
        modified: stmt.row.modified
      }
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return goal;
}

/**
 * Store a new goal.
 */
exports.createGoal = function createGoal(goal) {
  let goalId = -1;
  var stmt = dbConn.createStatement("INSERT INTO goals (title, position, created) VALUES(:title, :position, :created)");
  
  try {
    let now = new Date();

    stmt.params.title = goal.title;
    stmt.params.position = goal.position;
    stmt.params.created = now.toISOString();

    stmt.execute();
    goalId = getLatestId("goals");
    goal._id = goalId;
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return goal;
}

/**
 * Update an existing goal.
 */
exports.updateGoal = function updateGoal(goal) {
  var stmt = dbConn.createStatement("UPDATE goals SET title = :title, due_date = :dueDate, priority = :priority, position = :position, level = :level, completed = :completed, modified = :modified WHERE id = :id");
  
  try {
    let now = new Date();
    
    stmt.params.title = goal.title;
    stmt.params.dueDate = goal.dueDate ? goal.dueDate : null;
    stmt.params.priority = goal.priority ? goal.priority : 0;
    stmt.params.position = goal.position;
    stmt.params.level = goal.level ? goal.level : 0;
    stmt.params.completed = goal.completed ? goal.completed : null;
    stmt.params.modified = now.toISOString();
    stmt.params.id = goal._id;

    while (stmt.execute()) {
      goal.modified = stmt.row.modified;
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return goal;
}

/**
 * Delete an existing goal.
 */
exports.deleteGoal = function deleteGoal(goalId) {
  var stmt = dbConn.createStatement("DELETE FROM goals WHERE id = :id");
  
  try {
    stmt.params.id = goalId;
    stmt.execute();
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
}


/////////////////////////////////////////////////////////////////////////////
// TASKS                                                                   //
/////////////////////////////////////////////////////////////////////////////


/**
 * Load all tasks.
 */
exports.readTasks = function readTasks(goalId) {
  var stmt = dbConn.createStatement("SELECT * FROM tasks WHERE goal = :goalId ORDER BY position ASC");
  var results = [];
    
  try {
    stmt.params.goalId = goalId;

    while (stmt.executeStep()) {
      results.push({
        _id: stmt.row.id,
        goal: stmt.row.goal,
        title: stmt.row.title,
        dueDate: stmt.row.due_date,
        priority: stmt.row.priority,
        position: stmt.row.position,
        level: stmt.row.level,
        completed: stmt.row.completed,
        created: stmt.row.created,
        modified: stmt.row.modified
      });
    }    
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return results;
}

/**
 * Load a specific task.
 */
exports.readTask = function readTask(taskId) {
  var stmt = dbConn.createStatement("SELECT * FROM tasks WHERE id = :taskId");
  var task = null;
  
  try {
    stmt.params.taskId = taskId;
  
    while (stmt.executeStep()) {
      task = {
        _id: stmt.row.id,
        goal: stmt.row.goal,
        title: stmt.row.title,
        dueDate: stmt.row.due_date,
        priority: stmt.row.priority,
        position: stmt.row.position,
        level: stmt.row.level,
        completed: stmt.row.completed,
        created: stmt.row.created,
        modified: stmt.row.modified
      }
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return task;
}

/**
 * Store a new task.
 */
exports.createTask = function createTask(task) {
  let taskId = -1;
  var stmt = dbConn.createStatement("INSERT INTO tasks (goal, title, position, created) VALUES(:goal, :title, :position, :created)");
  
  try {
    let now = new Date();

    stmt.params.goal = task.goal;
    stmt.params.title = task.title;
    stmt.params.position = task.position;
    stmt.params.created = now.toISOString();

    stmt.execute();
    taskId = getLatestId("tasks");
    task._id = taskId;
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return task;
}

/**
 * Update an existing task.
 */
exports.updateTask = function updateTask(task) {
  var stmt = dbConn.createStatement("UPDATE tasks SET goal = :goal, title = :title, due_date = :dueDate, priority = :priority, position = :position, level = :level, completed = :completed, modified = :modified WHERE id = :id");
  
  try {
    let now = new Date();
    
    stmt.params.goal = task.goal;
    stmt.params.title = task.title;
    stmt.params.dueDate = task.dueDate ? task.dueDate : null;
    stmt.params.priority = task.priority ? task.priority : 0;
    stmt.params.position = task.position;
    stmt.params.level = task.level ? task.level : 0;
    stmt.params.completed = task.completed ? task.completed : null;
    stmt.params.modified = now.toISOString();
    stmt.params.id = task._id;
    
    while (stmt.executeStep()) {
      task.modified = stmt.row.modified;
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return task;
}

/**
 * Delete an existing task.
 */
exports.deleteTask = function deleteTask(taskId) {
  var stmt = dbConn.createStatement("DELETE FROM tasks WHERE id = :id");
  
  try {
    stmt.params.id = taskId;
    stmt.execute();
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
}


/////////////////////////////////////////////////////////////////////////////
// NOTES                                                                   //
/////////////////////////////////////////////////////////////////////////////


/**
 * Load all notes.
 */
exports.readNotes = function readNotes(taskId) {
  var stmt = dbConn.createStatement("SELECT * FROM notes WHERE task = :taskId ORDER BY created DESC");
  var results = [];
    
  try {
    stmt.params.taskId = taskId;

    while (stmt.executeStep()) {
      results.push({
        _id: stmt.row.id,
        task: stmt.row.task,
        body: stmt.row.body,
        created: stmt.row.created,
        modified: stmt.row.modified
      });
    }    
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return results;
}

/**
 * Load a specific note.
 */
exports.readNote = function readNote(noteId) {
  var stmt = dbConn.createStatement("SELECT * FROM notes WHERE id = :noteId");
  var note = null;
  
  try {
    stmt.params.noteId = noteId;
  
    while (stmt.executeStep()) {
      note = {
        _id: stmt.row.id,
        task: stmt.row.task,
        body: stmt.row.body,
        created: stmt.row.created,
        modified: stmt.row.modified
      }
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return note;
}

/**
 * Store a new note.
 */
exports.createNote = function createNote(note) {
  let noteId = -1;
  var stmt = dbConn.createStatement("INSERT INTO notes (task, body, created) VALUES(:task, :body, :created)");
  
  try {
    let now = new Date();

    stmt.params.task = note.task;
    stmt.params.body = note.body;
    stmt.params.created = now.toISOString();

    stmt.execute();
    noteId = getLatestId("notes");
    note._id = noteId;
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return note;
}

/**
 * Update an existing note.
 */
exports.updateNote = function updateNote(note) {
  var stmt = dbConn.createStatement("UPDATE notes SET task = :task, body = :body, modified = :modified WHERE id = :id");
  
  try {
    let now = new Date();
    
    stmt.params.task = note.task;
    stmt.params.body = note.body;
    stmt.params.modified = now.toISOString();
    stmt.params.id = note._id;

    while (stmt.executeStep()) {
      note.modified = stmt.row.modified;
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return note;
}

/**
 * Delete an existing note.
 */
exports.deleteNote = function deleteNote(noteId) {
  var stmt = dbConn.createStatement("DELETE FROM notes WHERE id = :id");
  
  try {
    stmt.params.id = noteId;
    stmt.execute();
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
}


/////////////////////////////////////////////////////////////////////////////
// BOOKMARKS                                                               //
/////////////////////////////////////////////////////////////////////////////


/**
 * Load all bookmarks.
 */
exports.readBookmarks = function readBookmarks(taskId) {
  var stmt = dbConn.createStatement("SELECT * FROM bookmarks WHERE task = :taskId ORDER BY created DESC");
  var results = [];
    
  try {
    stmt.params.taskId = taskId;

    while (stmt.executeStep()) {
      results.push({
        _id: stmt.row.id,
        task: stmt.row.task,
        title: stmt.row.title,
        url: stmt.row.url,
        description: stmt.row.description,
        thumbnail: stmt.row.thumbnail,
        content: stmt.row.content,
        created: stmt.row.created,
        modified: stmt.row.modified
      });
    }    
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return results;
}

/**
 * Load a specific bookmark.
 */
exports.readBookmark = function readBookmark(bookmarkId) {
  var stmt = dbConn.createStatement("SELECT * FROM bookmarks WHERE id = :bookmarkId");
  var bookmark = null;
  
  try {
    stmt.params.bookmarkId = bookmarkId;
  
    while (stmt.executeStep()) {
      bookmark = {
        _id: stmt.row.id,
        task: stmt.row.task,
        title: stmt.row.title,
        url: stmt.row.url,
        description: stmt.row.description,
        thumbnail: stmt.row.thumbnail,
        content: stmt.row.content,
        created: stmt.row.created,
        modified: stmt.row.modified
      }
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return bookmark;
}

/**
 * Store a new bookmark.
 */
exports.createBookmark = function createBookmark(bookmark) {
  let bookmarkId = -1;
  var stmt = dbConn.createStatement("INSERT INTO bookmarks (task, title, url, description, thumbnail, content, created) VALUES(:task, :title, :url, :description, :thumbnail, :content, :created)");
  
  try {
    let now = new Date();

    stmt.params.task = bookmark.task;
    stmt.params.title = bookmark.title;
    stmt.params.url = bookmark.url;
    stmt.params.description = bookmark.description ? bookmark.description : null;
    stmt.params.thumbnail = bookmark.thumbnail ? bookmark.thumbnail : null;
    stmt.params.content = bookmark.content ? bookmark.content : null;
    stmt.params.created = now.toISOString();

    stmt.execute();
    bookmarkId = getLatestId("bookmarks");
    bookmark._id = bookmarkId;
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return bookmark;
}

/**
 * Update an existing bookmark.
 */
exports.updateBookmark = function updateBookmark(bookmark) {
  var stmt = dbConn.createStatement("UPDATE bookmark SET task = :task, title = :title, url = :url, description = :description, thumbnail = :thumbnail, content = :content, modified = :modified WHERE id = :id");
  
  try {
    let now = new Date();
    
    stmt.params.task = bookmark.task;
    stmt.params.title = bookmark.title;
    stmt.params.url = bookmark.url;
    stmt.params.description = bookmark.description ? bookmark.description : null;
    stmt.params.thumbnail = bookmark.thumbnail ? bookmark.thumbnail : null;
    stmt.params.content = bookmark.content ? bookmark.content : null;
    stmt.params.modified = now.toISOString();
    stmt.params.id = bookmark._id;

    while (stmt.executeStep()) {
      bookmark.modified = stmt.row.modified;
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return bookmark;
}

/**
 * Delete an existing bookmark.
 */
exports.deleteBookmark = function deleteBookmark(bookmarkId) {
  var stmt = dbConn.createStatement("DELETE FROM bookmarks WHERE id = :id");
  
  try {
    stmt.params.id = bookmarkId;
    stmt.execute();
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
}


/////////////////////////////////////////////////////////////////////////////
// LOG ENTRIES                                                             //
/////////////////////////////////////////////////////////////////////////////


/**
 * Load all log entries.
 */
exports.readLogEntries = function readLogEntries() {
  var stmt = dbConn.createStatement("SELECT e.id, e.created FROM logentries e, logparams p WHERE e.id = p.logentry ORDER BY e.created DESC");
  var substmt = dbConn.createStatement("SELECT * FROM logparams WHERE logentry = :logEntryId");

  var results = [];
    
  try {  
    while (stmt.step()) {
      let logEntryId = stmt.row.id;
      let created = stmt.row.created;
            
      substmt.params.logEntryId = logEntryId;
      var params = [];
 
      while (substmt.step()) {      
        params.push({
          key: substmt.row.key,
          value: substmt.row.value
        });
      }
      
      results.push({
        _id: logEntryId,
        action: action,
        created: created,
        parameters: params
      });
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
    substmt.reset();
  }
    
  return results;
}

/**
 * Load all log entries regarding to a certain action.
 */
exports.readLogEntriesByAction = function readLogEntriesByAction(action) {
  var stmt = dbConn.createStatement("SELECT e.id, e.created FROM logentries e, logparams p WHERE e.id = p.logentry AND e.action = :action ORDER BY e.created DESC");
  var substmt = dbConn.createStatement("SELECT * FROM logparams WHERE logentry = :logEntryId");

  var results = [];
    
  try {
    stmt.params.action = action;
    
    while (stmt.step()) {
      let logEntryId = stmt.row.id;
      let created = stmt.row.created;
            
      substmt.params.logEntryId = logEntryId;
      var params = [];
 
      while (substmt.step()) {      
        params.push({
          key: substmt.row.key,
          value: substmt.row.value
        });
      }
      
      results.push({
        _id: logEntryId,
        action: action,
        created: created,
        parameters: params
      });
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
    substmt.reset();
  }
    
  return results;
}

/**
 * Load all log entries regarding to a certain task and action.
 */
exports.readLogEntriesByTask = function readLogEntriesByTask(taskId, action) {
  var stmt = dbConn.createStatement("SELECT e.id, e.created FROM logentries e, logparams p WHERE e.id = p.logentry AND e.action = :action AND p.key = 'taskId' AND p.value = :task ORDER BY e.created DESC");
  var substmt = dbConn.createStatement("SELECT * FROM logparams WHERE logentry = :logEntryId");

  var results = [];
    
  try {
    stmt.params.task = taskId;
    stmt.params.action = action;
    
    while (stmt.step()) {
      let logEntryId = stmt.row.id;
      let created = stmt.row.created;
      
      substmt.params.logEntryId = logEntryId;
      var params = [];

      while (substmt.step()) {      
        params.push({
          key: substmt.row.key,
          value: substmt.row.value,
          created: substmt.row.created
        });
      }        

      results.push({
        _id: logEntryId,
        action: action,
        created: created,
        parameters: params
      });
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
    substmt.reset();
  }
    
  return results;
}

/**
 * Store a new log entry.
 */
exports.createLogEntry = function createLogEntry(logEntry) {
  let logEntryId = -1;
  var stmt = dbConn.createStatement("INSERT INTO logentries (action, created) VALUES(:action, :created)");
  
  try {
    let now = new Date();

    stmt.params.action = logEntry.action;
    stmt.params.created = now.toISOString();
  
    stmt.execute();
    
    logEntryId = getLatestId("logentries");
    logEntry._id = logEntryId;
    
    if (logEntry.parameters) {
      for (let param of logEntry.parameters) {
        stmt = dbConn.createStatement("INSERT INTO logparams (logentry, key, value, created) VALUES(:logentry, :key, :value, :created)");

        stmt.params.logentry = logEntryId;
        stmt.params.key = param.key;
        stmt.params.value = param.value;
        stmt.params.created = now.toISOString();
        
        stmt.execute();
      }
    }
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return logEntry;
}

/**
 * Delete an existing log entry.
 */
exports.deleteLogEntry = function deleteLogEntry(logEntryId) {
  var stmt = dbConn.createStatement("DELETE FROM logentries WHERE id = :id");
  
  try {
    stmt.params.id = logEntryId;
    stmt.execute();
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
}


/////////////////////////////////////////////////////////////////////////////
// LOG PARAMETERS                                                          //
/////////////////////////////////////////////////////////////////////////////


/**
 * Load all parameters of a specific log entry.
 */
exports.readLogParams = function readLogParams(logEntryId) {
  var stmt = dbConn.createStatement("SELECT * FROM logparams WHERE log_entry = :logEntryId ORDER BY created DESC");
  var results = [];
    
  try {
    stmt.params.logEntryId = logEntryId;

    while (stmt.executeStep()) {
      results.push({
        _id: stmt.row.id,
        goal: stmt.row.goal,
        task: stmt.row.task,
        created: stmt.row.created,
        modified: stmt.row.modified
      });
    }    
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return results;
}

/**
 * Store new log entry parameters.
 */
exports.createLogParams = function createLogParams(logParams) {
  var stmt = dbConn.createStatement("INSERT INTO logparams (log_entry, key, value, created) VALUES(:log_entry, :key, :value, :created)");
  
  try {
    let now = new Date();

    stmt.params.log_entry = bookmark.log_entry;
    stmt.params.created = now.toISOString();

    stmt.execute();
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
}

/**
 * Delete the parameters of a specific log entry.
 */
exports.deleteLogParams = function deleteLogParams(logEntryId) {
  var stmt = dbConn.createStatement("DELETE FROM logparams WHERE log_entry = :id");
  
  try {
    stmt.params.logEntryId = logEntryId;
    stmt.execute();
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
}


/////////////////////////////////////////////////////////////////////////////
// SCREENSHOT                                                              //
/////////////////////////////////////////////////////////////////////////////


/**
 * Load all screenshots.
 */
exports.readScreenshots = function readScreenshots(taskId) {
  var stmt = dbConn.createStatement("SELECT * FROM screenshots WHERE task = :task ORDER BY created DESC");
  var results = [];
    
  try {
    stmt.params.task = taskId;

    while (stmt.executeStep()) {
      results.push({
        _id: stmt.row.id,
        taskId: stmt.row.task,
        image: stmt.row.screenshot,
        created: stmt.row.created,
        modified: stmt.row.modified
      });
    }    
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return results;
}

/**
 * Store a new screenshot.
 */
exports.createScreenshot = function createScreenshot(screenshot) {
  let screenshotId = -1;
  var stmt = dbConn.createStatement("INSERT INTO screenshots (task, screenshot, created) VALUES(:task, :screenshot, :created)");
  
  try {
    let now = new Date();

    stmt.params.task = screenshot.taskId;
    stmt.params.screenshot = screenshot.image ? screenshot.image : null;
    stmt.params.created = now.toISOString();

    stmt.execute();
    screenshotId = getLatestId("screenshots");
    screenshot._id = screenshotId;
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
  
  return screenshot;
}

/**
 * Delete an existing screenshot.
 */
exports.deleteScreenshot = function deleteScreenshot(screenshotId) {
  var stmt = dbConn.createStatement("DELETE FROM screenshots WHERE id = :id");
  
  try {
    stmt.params.id = screenshotId;
    stmt.execute();
  } catch (ex) {
    console.error(ex);
  } finally {
    stmt.reset();
  }
}


/////////////////////////////////////////////////////////////////////////////
// UTILITY                                                                 //
/////////////////////////////////////////////////////////////////////////////


/**
 * Get the primary key from the latest added entity of a given table.
 */
function getLatestId(table) {
  var id = -1;
  var stmt = dbConn.createStatement("SELECT * FROM " + table + " ORDER BY id DESC LIMIT 1");
  
  while (stmt.executeStep()) {
    id = stmt.row.id;
  }
  
  return id;
}
