const data = require("sdk/self").data;
const {Cc, Ci} = require("chrome");
const contextMenu = require("sdk/context-menu");
const pageMod = require("sdk/page-mod");
const services = require("./services");
const tabs = require('sdk/tabs');
const tabUtils = require("sdk/tabs/utils");
const notifications = require("sdk/notifications");
const hotkey = require("sdk/hotkeys").Hotkey;
const ui = require("sdk/ui");


var { viewFor } = require("sdk/view/core");

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
      /*worker.port.emit("getElements", "title");
      worker.port.on("gotElement", function(elementContent) {
        notify(worker.tab.title + " (" + worker.tab.url + ")");
        worker.tab.attach({
          //contentScript: 'document.body.style.border = "5px solid red";'
        });

        if (activeTask != null && activeTask.id != null) {
          // var json = { 
          //   "taskId" : activeTask.id,
          //   "url" : worker.tab.url,
          //   "title" : worker.tab.title, 
          //   "description" : "",
          //   "thumbnail" : tabs.activeTab.getThumbnail()
          // };

          // services.addHistory(getActiveWorker(), json);  
        } 
      });*/
    },
    // onReady: function(worker) {
    //   if (activeTask != undefined && activeTask != null) {
    //     var json = { 
    //       "taskId" : activeTask.id,
    //       "tabId" : tab.id,
    //       "url" : tab.url,
    //       "title" : tab.title,
    //       "thumbnail" : tab.getThumbnail(),
    //       "created" : new Date(),
    //       "modified" : new Date()
    //     };

    //     // Add tab via service layer
    //     console.log("Adding tab " + tab.title + " to task " + activeTask.title);
    //     //services.addTab(getActiveWorker(), JSON.stringify(json));

    //     addHistoryEntry(tab);
    //     // worker.port.emit("TabAdded", json);
    //   }
    // }
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

  /**
   * Context menu: Store text selection as note to current task.
   */ 
  var noteItem = contextMenu.Item({
    label: "Save text selection as note to my current task",
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
          "taskId" : activeTask.id,
          "body" : selectionText,
          "created" : new Date(),
          "modified" : new Date()
        };

        // Add note via service layer
        services.addNote(getActiveWorker(), JSON.stringify(json));
      }
    }
  });
  
  /**
   * Context menu: Store A HREF as bookmark to current task.
   */
  var bookmarkItem = contextMenu.Item({
    label: "Add this link as bookmark to my current task",
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
          "taskId" : activeTask.id,
          "url" : selectionText,
          "title" : selectionText, 
          "description" : "",
          "thumbnail" : tabs.activeTab.getThumbnail(),
          "created" : new Date(),
          "modified" : new Date()
        };

        // Add bookmark via service layer
        services.addBookmark(getActiveWorker(), JSON.stringify(json));
      }
    }
  });

  /**
   * Context menu: Set current page as a bookmark to the current task.
   */
  var pageItem = contextMenu.Item({
    label: "Add this page as bookmark to my current task",
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
          "taskId" : activeTask.id,
          "url" : tab.url,
          "title" : tab.title, 
          "description" : "",
          "thumbnail" : tabs.activeTab.getThumbnail(),
          "created" : new Date(),
          "modified" : new Date()
        };

        // Add bookmark via service layer
        services.addBookmark(getActiveWorker(), JSON.stringify(json));
      }
    }
  });
}

tabs.on('ready', function(tab) {
  if (activeTask != undefined && activeTask != null) {
    var browser = tabUtils.getBrowserForTab(viewFor(tab));

    var json = { 
      "taskId" : activeTask.id,
      "url" : tab.url,
      "title" : tab.title, 
      "description" : "",
      "thumbnail" : tab.getThumbnail(),
      "content" : browser.contentDocument.body.innerHTML,
      "relevance" : 0,
      "created" : new Date(),
      "modified" : new Date()
    };

    services.addHistoryEntry(getActiveWorker(), JSON.stringify(json));

    tab.attach({
      onAttach: function(worker) {
        if (worker != null && worker.port != undefined) {
          worker.port.emit("HistoryEntryAdded", json);            
        }
      }
    });
  }
});

// tabs.on('pageshow', addTabToTask);
// tabs.on('close', removeTabFromTask);
// tabs.on("ready", addHistoryEntry);

// function addTabToTask(tab) {
//   if (activeTask != undefined && activeTask != null) {
//     var json = { 
//       "taskId" : activeTask.id,
//       "tabId" : tab.id,
//       "url" : tab.url,
//       "title" : tab.title,
//       "thumbnail" : tab.getThumbnail(),
//       "created" : new Date(),
//       "modified" : new Date()
//     };

//     // Add tab via service layer
//     console.log("Adding tab " + tab.title + " to task " + activeTask.title);
//     //services.addTab(getActiveWorker(), JSON.stringify(json));

//     addHistoryEntry(tab);
//     // worker.port.emit("TabAdded", json);
//   }
// }

// function removeTabFromTask(tab) {
//   if (activeTask != undefined && activeTask != null) {
//     var json = { 
//       "taskId" : activeTask.id,
//       "tabId" : tab.id,
//       "url" : tab.url,
//       "title" : tab.title,
//       "created" : new Date(),
//       "modified" : new Date()
//     };

//     // Add tab via service layer
//     console.log("Deleting tab " + tab.title + " from task " + activeTask.title);
//     services.deleteTab(getActiveWorker(), JSON.stringify(json));
//     // worker.port.emit("TabRemoved", json);
//   }
// }

// function addHistoryEntry(tab) {
//   if (activeTask != undefined && activeTask != null) {

//     var browser = tabUtils.getBrowserForTab(viewFor(tab));
//     console.log(browser.contentDocument.body.innerHTML);

//     var json = { 
//       "taskId" : activeTask.id,
//       "url" : tab.url,
//       "title" : tab.title, 
//       "description" : "",
//       "thumbnail" : tab.getThumbnail(),
//       "content" : null,
//       "relevance" : 0,
//       "created" : new Date(),
//       "modified" : new Date()
//     };

//     console.log("Adding history entry " + tab.title + " to task " + activeTask.title);
//     services.addHistoryEntry(getActiveWorker(), JSON.stringify(json));
//     // worker.port.emit("HistoryEntryAdded", json);
//   }
// }

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
       * Redirects to a certain page.
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
        services.loadGoals(worker, user.id);
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
        activeTask = null;
        console.log("Setting " + activeGoal.title + " as active goal");
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
        services.loadTasks(worker, goal.id);
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
        console.log("Setting " + activeTask.title + " as active task");
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
        services.loadNotes(worker, task.id);          
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
        services.loadBookmarks(worker, task.id);
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
        services.loadTabs(worker, task.id);
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
       * Loads history of selected task.
       */
      worker.port.on("LoadHistory", function(task) {
        services.loadHistory(worker, task.id);
      });

      /**
       * Adds a new history entry to the selected task.
       */
      worker.port.on("AddHistoryEntry", function(historyEntry) {
        services.AddHistoryEntry(worker, historyEntry);
      });

      /**
       * Saves changes to an existing history entry.
       */
      worker.port.on("UpdateHistoryEntry", function(historyEntry) {
        services.updateHistoryEntry(worker, historyEntry);
      });

      /**
       * Deletes an existing history entry.
       */
      worker.port.on("DeleteHistoryEntry", function(historyEntry) {
        services.deleteHistoryEntry(worker, historyEntry);
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

