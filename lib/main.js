const data = require("sdk/self").data;
const {Cc, Ci} = require("chrome");
const contextMenu = require("sdk/context-menu");
const pageMod = require("sdk/page-mod");
const services = require("./services");
const tabs = require('sdk/tabs');
const notifications = require("sdk/notifications");
const hotkey = require("sdk/hotkeys").Hotkey;
const ui = require("sdk/ui");

var sidebar = null;
var workers = [];

var activeUser = null;
var activeGoal = null;
var activeTask = null;

/**
 * Constructor, called when add-on gets installed or activated.
 */
exports.main = function(options, callbacks) {
	addToolbarButton();
  setContextMenuItems();
  createSideBar();

  pageMod.PageMod({
    include: ["*"],
    contentScriptWhen: 'ready',
    contentScriptFile: data.url("firefox/element-getter.js"),
    onAttach: function(worker) {
      worker.port.emit("getElements", "title");
      worker.port.on("gotElement", function(elementContent) {
        console.log(elementContent);
        notify(worker.tab.title + " (" + worker.tab.url + ")");
        worker.tab.attach({
          //contentScript: 'document.body.style.border = "5px solid red";'
        });

        if (activeTask != null && activeTask.id != null) {
          // var json = { 
          //   "taskId" : activeTask.idAsString,
          //   "url" : worker.tab.url,
          //   "title" : worker.tab.title, 
          //   "description" : "",
          //   "thumbnail" : tabs.activeTab.getThumbnail()
          // };

          // services.addHistory(getActiveWorker(), json);  
        } 
      });
    }
  });
};

//function checkPageInLinks(url) {
//  notify("This page is already in your bookmark list.");
//}

/**
 * Destructor, called when add-on gets uninstalled or deactivated.
 */
exports.onUnload = function(reason) {
  if(reason == "uninstall" || reason == "disable"){
    removeToolbarButton();
  }
};

/**
 * This function adds the toolbar button.
 */ 
function addToolbarButton() {
  var mediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
  var document = mediator.getMostRecentWindow("navigator:browser").document;      
  var navBar = document.getElementById("nav-bar");
  
  if (!navBar) {
    return;
  }

  var btn = document.createElement("toolbarbutton");  
  btn.setAttribute('type', 'button');
  btn.setAttribute('class', 'toolbarbutton-1');
  btn.setAttribute('image', data.url('img/icon16.png')); // path is relative to data folder
  btn.setAttribute('orient', 'horizontal');
  btn.setAttribute('label', 'Tasks Todo');
  btn.addEventListener('click', function() {
    // Open the side bar
    toggleSideBar();
//togglePanel();
    // Show context menu buttons
//    toggleContextMenu();
  }, false);

  navBar.insertBefore(btn, navBar.firstChild);
}

/**
 * This function removes the toolbar button.
 */ 
function removeToolbarButton() {
  var mediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
  var document = mediator.getMostRecentWindow('navigator:browser').document;    
  var navBar = document.getElementById('nav-bar');
  var btn = document.getElementById('toolbarButtonTaskInfo');
  
  if (navBar && btn) {
    navBar.removeChild(btn);
  }
}

/**
 * This function adds context sensitive right click menu entries.
 */ 
function setContextMenuItems() {

console.log(JSON.stringify(activeTask));


  /**
   * Context menu: Store text selection as note to current task.
   */ 
  var noteItem = contextMenu.Item({
    label: "Save selection as note in current task",
    context: contextMenu.SelectionContext(),
    contentScript: 'self.on("click", function () {' +
                   '  self.postMessage(window.getSelection().toString());' + 
                   '});' +
                   'self.on("context", function () {' + 
                    '  return true;' +
                   //'  if (activeTask == undefined || activeTask == null) { return false } else { return true };' +
                   '});',
    onMessage: function (selectionText) {
      if (activeTask != undefined && activeTask != null) {
        var json = { 
          "taskId" : activeTask.idAsString,
          "body" : selectionText
        };

        // Add note via service layer
        services.addNote(getActiveWorker(), json);
      }
    }
  });
  
  /**
   * Context menu: Store A HREF as bookmark to current task.
   */
  var bookmarkItem = contextMenu.Item({
    label: "Add link as bookmark to current task",
    context: contextMenu.SelectorContext('a[href]'),
    contentScript:  'self.on("click", function (node, data) {' +
                    '  self.postMessage(node.href);' +
                    '});' +
                    'self.on("context", function () {' + 
                    '  return true;' +
                    //'  if (activeTask == undefined || activeTask == null) { return false } else { return true };' +
                    '});',
    onMessage: function (selectionText) {  
      if (activeTask != undefined && activeTask != null) {
        var json = { 
          "taskId" : activeTask.idAsString,
          "url" : selectionText,
          "title" : selectionText, 
          "description" : "",
          "thumbnail" : tabs.activeTab.getThumbnail()
        };

        // Add bookmark via service layer
        services.addBookmark(getActiveWorker(), json);
      }
    }
  });

  /**
   * Context menu: Set current page as a bookmark to the current task.
   */
  var pageItem = contextMenu.Item({
    label: "Add bookmark to current task",
    context: contextMenu.PageContext(),
    contentScript:  'self.on("click", function () {' +
                    '  self.postMessage();' +
                    '});' +
                    'self.on("context", function () {' + 
                    '  return true;' +
                    //'  if (activeTask == undefined || activeTask == null) { return false } else { return true };' +
                    '});',
    onMessage: function () {
      if (activeTask != undefined && activeTask != null) {
        var tab = tabs.activeTab;
        var json = { 
          "taskId" : activeTask.idAsString,
          "url" : tab.url,
          "title" : tab.title, 
          "description" : "",
          "thumbnail" : tabs.activeTab.getThumbnail()
        };

        // Add bookmark via service layer
        services.addBookmark(getActiveWorker(), json);
      }
    }
  });
}

tabs.on('pageshow', addTabToTask);
tabs.on('close', removeTabFromTask);
tabs.on("ready", addHistoryEntry);

function addTabToTask(tab) {
  if (activeTask != undefined && activeTask != null) {
      var json = { 
        "taskId" : activeTask.idAsString,
        "tabId" : tab.id,
        "url" : tab.url,
        "title" : tab.title,
        "thumbnail" : tab.getThumbnail()
      };

      // Add tab via service layer
      services.addTab(getActiveWorker(), json);
  }
}

function removeTabFromTask(tab) {
  if (activeTask != undefined && activeTask != null) {
      var json = { 
        "taskId" : activeTask.idAsString,
        "tabId" : tab.id,
        "url" : tab.url,
        "title" : tab.title
      };

      // Add tab via service layer
      services.deleteTab(getActiveWorker(), json);
  }
}

function addHistoryEntry(tab) {
  if (activeTask != undefined && activeTask != null) {
      var json = { 
        "taskId" : activeTask.idAsString,
        "url" : tab.url,
        "title" : tab.title, 
        "description" : "",
        "thumbnail" : tab.getThumbnail()
      };

      services.addHistory(getActiveWorker(), json);
  }
}

/**
 * Returns the active worker, which is used for interscript communication
 */ 
function getActiveWorker() {
  return workers[0];
}

/**
 * This function creates the sidebar.
 */
function createSideBar() {
  sidebar = ui.Sidebar({
    id: 'taskstodo-sidebar',
    title: 'TasksTodo.org',
    url: data.url("login.html"),
//    style: 'min-width: 200px; width: 300px; max-width: 400px',

    onAttach: function (worker) {
      // Add sidebar worker to the workers array
      workers.push(worker);
      worker.on("detach", function() {
        var index = workers.indexOf(worker);
        if (index >= 0) workers.splice(index, 1);
      });

      /////////////////////////////////////////////////////////////////////////////
      // NAVIGATION                                                              //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * ...
       */
      worker.port.on("Redirect", function(page) {
        sidebar.url = data.url(page);
      });

      /////////////////////////////////////////////////////////////////////////////
      // USERS                                                                   //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Login user by username and password.
       */
      worker.port.on("LoginUser", function(user) {
        services.loginUser(worker, user);
      });

      /**
       * Sets active user.
       */
      worker.port.on("SetActiveUser", function(user) {
        activeUser = user;
      });

      /**
       * Return active user.
       */
      worker.port.on("GetActiveUser", function() {
        worker.port.emit("ActiveUserLoaded", activeUser);
      });

      /////////////////////////////////////////////////////////////////////////////
      // TASKS                                                                   //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all goals.
       */
      worker.port.on("LoadGoals", function(user) {
        services.loadGoals(worker, user.idAsString);
      });

      /**
       * Adds a new goal.
       */
      worker.port.on("AddGoal", function(goal) {
        services.addGoal(worker, goal);
      });

      /**
       * Saves changes to an existing goal.
       */
      worker.port.on("UpdateGoal", function(goal) {
        services.updateGoal(worker, goal);
      });

      /**
       * Deletes an existing goal.
       */
      worker.port.on("DeleteGoal", function(goal) {
        services.deleteGoal(worker, goal);
      });

      /**
       * Sets active goal.
       */
      worker.port.on("SetActiveGoal", function(goal) {
        console.log("Active goal: " + goal.title);
        activeGoal = goal;
      });

      /**
       * Return active goal.
       */
      worker.port.on("GetActiveGoal", function() {
        worker.port.emit("ActiveGoalLoaded", activeGoal);
      });

      /////////////////////////////////////////////////////////////////////////////
      // TASKS                                                                   //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all tasks.
       */
      worker.port.on("LoadTasks", function(goal) {
        services.loadTasks(worker, goal.idAsString);
      });

      /**
       * Adds a new task.
       */
      worker.port.on("AddTask", function(task) {
        services.addTask(worker, task);
      });

      /**
       * Saves changes to an existing task.
       */
      worker.port.on("UpdateTask", function(task) {
        services.updateTask(worker, task);
      });

      /**
       * Deletes an existing task.
       */
      worker.port.on("DeleteTask", function(task) {
        services.deleteTask(worker, task);
      });

      /**
       * Sets active task.
       */
      worker.port.on("SetActiveTask", function(task) {
        activeTask = task;
      });

      /**
       * Return active task.
       */
      worker.port.on("GetActiveTask", function() {
        worker.port.emit("ActiveTaskLoaded", activeTask);
      });

      /////////////////////////////////////////////////////////////////////////////
      // TASK: NOTES                                                             //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all notes regarding to the selected task.
       */
      worker.port.on("LoadNotes", function(task) {
        services.loadNotes(worker, task.idAsString);          
      });

      /**
       * Adds a new note to the selected task.
       */
      worker.port.on("AddNote", function(note) {
        services.addNote(worker, note);
      });

      /**
       * Saves changes to an existing note.
       */
      worker.port.on("UpdateNote", function(note) {
        services.updateNote(worker, note);
      });

      /**
       * Deletes an existing note.
       */
      worker.port.on("DeleteNote", function(note) {
        services.deleteNote(worker, note);
      });

      /////////////////////////////////////////////////////////////////////////////
      // TASK: BOOKMARKS                                                         //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all bookmarks regarding to the selected task.
       */
      worker.port.on("LoadBookmarks", function(task) {
        services.loadBookmarks(worker, task.idAsString);
      });

      /**
       * Adds a new bookmark to the selected task.
       */
      worker.port.on("AddBookmark", function(bookmark) {
        services.addBookmark(worker, bookmark);
      });

      /**
       * Saves changes to an existing bookmark.
       */
      worker.port.on("UpdateBookmark", function(bookmark) {
        services.updateBookmark(worker, bookmark);
      });

      /**
       * Deletes an existing bookmark.
       */
      worker.port.on("DeleteBookmark", function(bookmark) {
        services.deleteBookmark(worker, bookmark);
      });

      /////////////////////////////////////////////////////////////////////////////
      // TASK: TABS                                                              //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all tabs regarding to the selected task.
       */
      worker.port.on("LoadTabs", function(task) {
        services.loadTabs(worker, task.idAsString);
      });

      /**
       * Adds a new tab to the selected task.
       */
      worker.port.on("AddTab", function(tab) {
        services.addTab(worker, tab);
      });

      /**
       * Saves changes to an existing tab.
       */
      worker.port.on("UpdateTab", function(tab) {
        services.updateTab(worker, tab);
      });

      /**
       * Deletes an existing tab.
       */
      worker.port.on("DeleteTab", function(tab) {
        services.deleteTab(worker, tab);
      });

      /////////////////////////////////////////////////////////////////////////////
      // TASK: HISTORY                                                           //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all histories regarding to the selected task.
       */
      worker.port.on("LoadHistories", function(task) {
        services.loadHistories(worker, task.idAsString);
      });

      /**
       * Adds a new history to the selected task.
       */
      worker.port.on("AddHistory", function(history) {
        services.addHistory(worker, history);
      });

      /**
       * Saves changes to an existing history.
       */
      worker.port.on("UpdateHistory", function(history) {
        services.updateHistory(worker, history);
      });

      /**
       * Deletes an existing history.
       */
      worker.port.on("DeleteHistory", function(history) {
        services.deleteHistory(worker, history);
      });
    },
    onShow: function () {
      console.log("Showing sidebar");   
    },
    onHide: function () {
      console.log("Hiding sidebar");
    },
    onDetach: function () {
      console.log("Detaching sidebar");
    }
  });
}

/**
 * This function opens the sidebar and loads the Tasks Todo website.
 */
function toggleSideBar() {
  sidebar.show();
}

function notify(message) {
  notifications.notify({
    title: "Tasks Todo",
    text: message
  });
}

