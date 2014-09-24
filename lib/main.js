const data = require("sdk/self").data;
const {Cc, Ci, Cu} = require("chrome");
const contextMenu = require("sdk/context-menu");
const pageMod = require("sdk/page-mod");
const windowUtils = require('sdk/window/utils');
const tabs = require('sdk/tabs');
const tabUtils = require("sdk/tabs/utils");
const notifications = require("sdk/notifications");
const hotkey = require("sdk/hotkeys").Hotkey;
const ui = require("sdk/ui");
const services = require("./services");

var { viewFor } = require("sdk/view/core");

var sidebar = null;
var workers = [];

var activeUser = null;
var activeGoal = null;
var activeTask = null;

var latestUrl = null;

/**
 * Constructor, called when add-on gets installed or activated.
 */
exports.main = function(options, callbacks) {
	addToolbarButton();
  setContextMenuItems();
  createSideBar();

  pageMod.PageMod({
    include: ["*"],
    contentScriptWhen: 'start',
    contentScriptFile: [data.url("js/jquery-1.10.2.min.js"), data.url("firefox/element-getter.js")],
    onAttach: function(worker) {
      worker.destroy();
    }
  });
};

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

/**
 * Window and Page Listener
 */
// Cu.import("resource://gre/modules/XPCOMUtils.jsm", this);

// const STATE_START = Ci.nsIWebProgressListener.STATE_START;
// const STATE_STOP = Ci.nsIWebProgressListener.STATE_STOP;

// var myListener = {
//   QueryInterface: XPCOMUtils.generateQI(["nsIWebProgressListener",
//                                          "nsISupportsWeakReference"]),

//   onStateChange: function(aWebProgress, aRequest, aFlag, aStatus) {
//     if (aFlag & STATE_START) {
//     }

//     if (aFlag & STATE_STOP) {
//       var win = aWebProgress.DOMWindow;

//       if (latestUrl != win.location.href) {
//         if (win.location.href.indexOf('#') >= 0) { // is ajax used? (e.g. https://www.google.de/?gws_rd=ssl#q=Eightbit&start=20)
//           if (latestUrl == win.location.href.split('#')[0] 
//               || (latestUrl.indexOf('#') >= 0 && latestUrl.split('#')[0] == win.location.href.split('#')[0])) {
//             latestUrl = win.location.href;
//             console.log(">> " + win.location.hash);  
//             addHistoryEntry();
//           }
//         }
//       }
//     }
//   },

//   onLocationChange: function(aWebProgress, aRequest, aLocation) {  
//     return 0;
//   },

//   onProgressChange: function(aWebProgress, aRequest, curSelf, maxSelf, curTot, maxTot) { 
//     return 0;
//   },
  
//   onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) {
//     return 0;
//   },
  
//   onSecurityChange: function(aWebProgress, aRequest, aState) {
//     return 0;
//   } 
// }

// gBrowser.addProgressListener(myListener);

var win = windowUtils.getMostRecentBrowserWindow();
var gBrowser = windowUtils.getMostRecentBrowserWindow().getBrowser();
gBrowser.tabContainer.addEventListener("load", function load(event){
    gBrowser.tabContainer.removeEventListener("load", load, false); //remove listener, no longer needed
    myExtension.init();  
},false);

var myExtension = {
  init: function() {
    var appcontent = win.document.getElementById("appcontent");   // browser
    
    if (appcontent) {
      appcontent.addEventListener("load", myExtension.onPageLoad, true);
      appcontent.addEventListener("hashchange", myExtension.onHashChange, true);
    }

    // var messagepane = win.document.getElementById("messagepane"); // mail
    // if (messagepane) {
    //   messagepane.addEventListener("load", function(event) { 
    //     myExtension.onPageLoad(event);
    //   }, true);
    // }
  },

  onPageLoad: function(aEvent) {
    var doc = aEvent.originalTarget;
    console.log(doc.location.href);
    addHistoryEntry();

    // add event listener for page unload 
    aEvent.originalTarget.defaultView.addEventListener("unload", function(event) { 
      myExtension.onPageUnload(event); 
    }, true);
  },
  
  onHashChange: function(aEvent) {
    var doc = aEvent.originalTarget;
    console.log(doc.location.href);
    addHistoryEntry();
  },
  
  onPageUnload: function(aEvent) {
    // do something
  }
};

// tabs.on('pageshow', function(tab) {
//   addHistoryEntry();
// });

function addHistoryEntry() {
  var tab = tabs.activeTab;

  if (activeTask != null && tab != null && tab.url != "about:blank" && latestUrl != tab.url) {
    var body = gBrowser.contentDocument.body != null ? gBrowser.contentDocument.body.innerHTML : "";

    var json = { 
      "taskId" : activeTask.id,
      "url" : tab.url,
      "title" : tab.title, 
      "description" : "",
      "thumbnail" : tab.getThumbnail(),
      "content" : body,
      "relevance" : 0,
      "created" : new Date(),
      "modified" : new Date()
    };

    services.addHistoryEntry(getActiveWorker(), JSON.stringify(json));
    latestUrl = tab.url;
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

