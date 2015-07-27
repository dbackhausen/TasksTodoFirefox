const data = require("sdk/self").data;
const {Cc, Ci, Cu} = require("chrome");
const contextMenu = require("sdk/context-menu");
const pageMod = require("sdk/page-mod");
const windowUtils = require('sdk/window/utils');
const tabs = require('sdk/tabs');
const tabUtils = require("sdk/tabs/utils");
const { ActionButton } = require("sdk/ui/button/action");
const notifications = require("sdk/notifications");
const hotkey = require("sdk/hotkeys").Hotkey;
const ui = require("sdk/ui");
const { viewFor } = require("sdk/view/core");
const services = require("./services");
const utils = require("./utils");

utils.jsonToDOM.namespaces = {
  html: 'http://www.w3.org/1999/xhtml',
  xul: 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul'
};
utils.jsonToDOM.defaultNamespace = utils.jsonToDOM.namespaces.html;

const BOOKMARK_MESSAGE = "You have bookmarked this page in your current task.";

const doc = require('sdk/window/utils').getMostRecentBrowserWindow().document;

var sidebar = null;
var sidebarStatus = 'hidden';
var workers = [];

var btnAddTab;
var btnAddAllTabs;

var activeUser = null;
var activeGoal = null;
var activeTask = null;

var taskBookmarks = [];
var taskTabs = [];
var taskHistory = [];

// Create tootbar button for TasksTodo
var button = ActionButton({
  id: "btn-taskstodo",
  label: "TasksTodo",
  icon: {
    "16": "./img/icon16.png",
    "32": "./img/icon32.png"
  },
  onClick: toggleSideBar
});

/**
 * Constructor, called when add-on gets installed or activated.
 */
exports.main = function(options, callbacks) {
  // Create the TT sitebar
  createSideBar();

  // Add TT context menu items
  setContextMenuItems();
};

/**
 * Destructor, called when add-on gets uninstalled or deactivated.
 */
exports.onUnload = function(reason) {
  if (reason == "uninstall" || reason == "disable"){
    removeToolbarButton();
  }
};

/**
 * This function adds context sensitive right click menu entries.
 */ 
function setContextMenuItems() {
//  /**
//   * Context menu: Store tab to the current task.
//   */ 
//  contextMenu.Item({
//    label: "Save this tab to my current task",
//    context: [
//      contextMenu.PageContext(),      
//      contextMenu.PredicateContext(function(data) { return (activeTask != undefined && activeTask != null && activeTask._id != null && tabs.activeTab.url != "about:blank" && !utils.isTabAlreadyStored(tabs.activeTab.url, taskTabs)); }),
//    ],
//    contentScript: 'self.on("click", function () {' +
//                   '  self.postMessage();' + 
//                   '});',
//    image: data.url("../data/img/icon24.png"),
//    onMessage: function () {
//      saveTab(tabs.activeTab, true);
//    }
//  });
  
  /**
   * Context menu: Store text selection as new note to the current task.
   */ 
  contextMenu.Item({
    label: "Save text selection as a note to my current task",
    context: [
      contextMenu.SelectionContext(),
      contextMenu.PredicateContext(function(data) { return (activeTask != undefined && activeTask != null && activeTask._id != null); }),
    ],
    contentScript: 'self.on("click", function () {' +
                   '  self.postMessage(window.getSelection().toString());' + 
                   '});',
    image: data.url("../data/img/icon24.png"),
    onMessage: function (selectionText) {
      if (activeTask != undefined && activeTask != null) {
        var json = { 
          "taskId" : activeTask._id,
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
   * Context menu: Add the linked page as bookmark to the current task.
   */
  contextMenu.Item({
    label: "Add this link as a bookmark to my current task",
    context: [
      contextMenu.SelectorContext('a[href]'),
      contextMenu.PredicateContext(function(data) { return (activeTask != undefined && activeTask != null && activeTask._id != null && !utils.isPageAlreadyBookmarked(data.documentURL, taskBookmarks)); }),
    ],
    contentScript:  'self.on("click", function (node, data) {' +
                    '  self.postMessage(node.href);' +
                    '});',
    image: data.url("../data/img/icon24.png"),
    onMessage: function (link) {  
      if (activeTask != undefined && activeTask != null) {
        // Add bookmark
        addBookmark(activeTask._id, link, link, "", tabs.activeTab.getThumbnail());
      }
    }
  });

  /**
   * Context menu: Store linked file as an attachment to the current task.
   */
  let saveItem = contextMenu.Item({
    label: "Add this linked file as an attachment to my current task",
    context: [
      contextMenu.SelectorContext('a[href]'),
      contextMenu.PredicateContext(function(data) { return (activeTask != undefined && activeTask != null && activeTask._id != null); }),
    ],
    contentScript:  'self.on("click", function (node, data) {' +
                    '  self.postMessage(node.href);' +
                    '});',
    image: data.url("../data/img/icon24.png"),
    onMessage: function (selectionText) {  
      if (activeTask != undefined && activeTask != null) {
        // Load a linked file as attachment
        loadFileAsAttachment(activeTask._id, selectionText);
      }
    }
  });

  /**
   * Context menu: Add page as a bookmark to the current task.
   */
  contextMenu.Item({
    label: "Add this page as a bookmark to my current task",
    context: [
      contextMenu.PageContext(),
      contextMenu.PredicateContext(function(data) { return (activeTask != undefined && activeTask != null && activeTask._id != null && tabs.activeTab.url != "about:blank" && !utils.isPageAlreadyBookmarked(tabs.activeTab.url, taskBookmarks)); }),
    ],
    contentScript: 'self.on("click", function () {' +
                   '  self.postMessage();' + 
                   '});',
    image: data.url("../data/img/icon24.png"),
    onMessage: function() {
      if (activeTask != undefined && activeTask != null) {
        // Add bookmark
        addBookmark(activeTask._id, tabs.activeTab.url, tabs.activeTab.title, "", tabs.activeTab.getThumbnail());

        // Set page notification
        showPageNotification(BOOKMARK_MESSAGE);
      }
    }
  });
  
  btnAddTab = require("menuitems").Menuitem({
    id: "tt-add-tab-to-task",
    menuid: "tabContextMenu",
    image: data.url("../data/img/icon24.png"),
    label: "Add this tab to my task",
    disabled: true,
    onCommand: function() {
      saveTab(tabs.activeTab, true);
    }
  });
  
  btnAddAllTabs = require("menuitems").Menuitem({
    id: "tt-add-all-tabs-to-task",
    menuid: "tabContextMenu",
    image: data.url("../data/img/icon24.png"),
    label: "Add all tabs to my task",
    disabled: true,
    onCommand: function() {
      for (let tab of tabs) {
        saveTab(tab, false);
      }
      
      // reload all tabs
      services.loadTabs(worker, activeTask._id);
    }
  });
  
  let menu = doc.getElementById("tabContextMenu");
  menu.insertBefore(doc.createElement("menuseparator"), doc.getElementById("tt-add-tab-to-task"));
}

/**
 * Toggles the context menu for state change
 */
function toggleContextMenu() {
  btnAddTab.disabled = (activeTask._id == undefined || tabs.activeTab == undefined || tabs.activeTab.url == "about:blank" || utils.isTabAlreadyStored(tabs.activeTab.url, taskTabs));
  btnAddAllTabs.disabled = (activeTask._id == undefined || tabs.activeTab == undefined || tabs.activeTab.url == "about:blank" || tabs.length <= 1);
};

/**
 * Track page load for task history
 */
var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
var mainWindow = wm.getMostRecentWindow("navigator:browser");
var gBrowser = mainWindow.gBrowser;
var lastURI = "";

const gCompleteState = Ci.nsIWebProgressListener.STATE_IS_WINDOW + Ci.nsIWebProgressListener.STATE_STOP;

var tabsProgressListener = {
  onProgressChange: function(aBrowser, aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {
  },

  onLocationChange: function(aBrowser, aWebProgress, aRequest, aLocation) {
  },

  onStateChange: function(aBrowser, aWebProgress, aRequest, aFlag, aStatus) {
    if ((aFlag & Ci.nsIWebProgressListener.STATE_STOP) && (aFlag & Ci.nsIWebProgressListener.STATE_IS_REQUEST) 
      || (aFlag & Ci.nsIWebProgressListener.STATE_STOP) && (aFlag & Ci.nsIWebProgressListener.STATE_IS_NETWORK)) {
      //console.log(tabs.activeTab.url);
      if (activeTask && tabs && tabs.activeTab && tabs.activeTab.url.replace(lastURI, "").length > 0) {
        // Handle location change!
        onLocationChange(tabs.activeTab.url);
        lastURI = tabs.activeTab.url;
      }
    }
  },

  onDownloadStateChange: function(aState, aDownload) {
    switch(aDownload.state) {
      case Ci.nsIDownloadManager.DOWNLOAD_NOTSTARTED:
      break;            
      case Ci.nsIDownloadManager.DOWNLOAD_QUEUED:
      break;         
      case Ci.nsIDownloadManager.DOWNLOAD_DOWNLOADING:
      break;
      case Ci.nsIDownloadManager.DOWNLOAD_FINISHED:
      break;            
      case Ci.nsIDownloadManager.DOWNLOAD_FAILED:
      break;            
      case Ci.nsIDownloadManager.DOWNLOAD_CANCELED:
      break;
    }
  }
};

gBrowser.removeTabsProgressListener(tabsProgressListener);
gBrowser.addTabsProgressListener(tabsProgressListener);

/**
 * Handle location changes (e.g. track history or check bookmarks)
 */ 
var lastUrl;
var urlTimestamp;
var lastProvider;
var lastQuery;

function onLocationChange(url) {
  if (url && url != "about:blank" && url != "about:newtab") {
    if (url.replace(lastUrl, "").length != 0) {
      lastUrl = url;
      console.log("Location Change: " + url);

      // Add a browsing history event
      var body = gBrowser.contentDocument.body != null ? gBrowser.contentDocument.body.innerHTML : "";

      // Add history entry
      addHistoryEntry({
        "userId": JSON.parse(activeUser)._id,
        "action": "location_change",
        "parameters": [
          {
            "key": "taskId",
            "value": activeTask._id
          },
          {
            "key": "url",
            "value": url
          },
          {
            "key": "title",
            "value": tabs.activeTab.title
          },
          {
            "key": "thumbnail",
            "value": tabs.activeTab.getThumbnail()
          },
          {
            "key": "body",
            "value": body
          }
        ]
      });

      // Show a notification when the page is bookmarked in the current task
      showBookmarkedPage(url);
          
      var provider = utils.getSearchProvider(url);
      var query = utils.getQueryString(url);

      if (provider != null && query != null && provider.length > 0 && query.length > 0) {
        if (provider.replace(lastProvider, "").length != 0 || query.replace(lastQuery, "").length != 0) {          
          addQuery({
            "userId": JSON.parse(activeUser)._id,
            "action": "search_executed",
            "parameters": [
              {
                "key": "taskId",
                "value": activeTask._id
              },
              {
                "key": "provider",
                "value": provider
              },
              {
                "key": "query",
                "value": query
              },
              {
                "key": "url",
                "value": url
              }
            ]
          });
        }
        
        lastProvider = provider;
        lastQuery = query;
      }
      
      // Show a notification of the latest queries if exist
      showSearchQueries(url);
      
      // Toggle the context menu
      toggleContextMenu();
    }
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
        console.log("Redirect to: " + page);
        sidebar.url = data.url(page);
      });

      /////////////////////////////////////////////////////////////////////////////
      // USERS                                                                   //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Saves changes to the current user.
       */
      worker.port.on("UpdateUser", function(user) {
        //TODO services.updateUser(worker, user);
      });

      /**
       * Login user by username and password.
       */
      worker.port.on("LoginUser", function(user) {
        services.loginUser(worker, user);
        
        addLogEntry({
          "action": "login",
          "parameters": [
            {
              "key": "username",
              "value": JSON.parse(user).username
            }
          ]
        });
      });

      /**
       * Sets active user.
       */
      worker.port.on("SetActiveUser", function(user) {
        activeUser = user;
        
        addLogEntry({
          "userId": JSON.parse(activeUser)._id,
          "action": "logged_in",
          "parameters": []
        });
      });

      /**
       * Return active user.
       */
      worker.port.on("GetActiveUser", function() {
        worker.port.emit("ActiveUserLoaded", activeUser);
      });

      /**
       * Register user.
       */
      worker.port.on("RegisterUser", function(user) {
        services.registerUser(worker, user);
        
        addLogEntry({
          "userId": JSON.parse(activeUser)._id,
          "action": "register",
          "parameters": [
            {
              "key": "username",
              "value": JSON.parse(user).username
            }
          ]
        });
      });

      /**
       * Forgot password.
       */
      worker.port.on("SendPassword", function(username) {
        services.sendPassword(worker, username);
      });

      /////////////////////////////////////////////////////////////////////////////
      // GOALS                                                                   //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all goals.
       */
      worker.port.on("LoadGoals", function(user) {
        services.loadGoals(worker, user._id);
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
        if (goal != null) {
          var msg = "The goal '" + goal.title + "' has been selected!";
          console.log(msg);
          notify("Goal selected", msg);
          
          addLogEntry({
            "userId": JSON.parse(activeUser)._id,
            "action": "goal_selected",
            "parameters": [
              {
                "key": "goalId",
                "value": goal._id
              }
            ]
          });
        } else {
          var msg = "The goal '" + activeGoal.title + "' has been deselected!";
          console.log(msg);
          notify("Goal deselected", msg);
                            
          addLogEntry({
            "userId": JSON.parse(activeUser)._id,
            "action": "goal_deselected",
            "parameters": [
              {
                "key": "goalId",
                "value": activeGoal
              }
            ]
          });
        }
                
        // Set active goal
        activeGoal = goal;
        activeTask = null;
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
        services.loadTasks(worker, goal._id);
      });
      
      /**
       * Load a specific task.
       */
      worker.port.on("LoadTask", function(taskId) {
        services.loadTask(worker, taskId);
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
        
        
        if (task != null) {
          var msg = "The task '" + task.title + "' has been selected!";
          console.log(msg);
          notify("Task selected", msg);
                            
          addLogEntry({
            "userId": JSON.parse(activeUser)._id,
            "action": "task_selected",
            "parameters": [
              {
                "key": "taskId",
                "value": task._id
              }
            ]
          });
        } else {
          var msg = "The task '" + activeTask.title + "' has been deselected!";
          console.log(msg);
          notify("Task deselected", msg);
          
          addLogEntry({
            "userId": JSON.parse(activeUser)._id,
            "action": "task_deselected",
            "parameters": [
              {
                "key": "taskId",
                "value": activeTask._id
              }
            ]
          });
        }
        
        // Set new active task
        activeTask = task;
        
        // Hide any page notification
        hidePageNotification();

        // Hide the latest search queries
        hideLatestQueries();

        // Toggle the context menu
        toggleContextMenu();
        
        if (activeTask && activeTask._id) {
          if (tabs && tabs.activeTab) {
            /* Check if we can show notifications regarding 
               the newly selected task! */
            var url = tabs.activeTab.url;
            showSearchQueries(url);
          } 
        }    
      });

      /**
       * Return active task.
       */
      worker.port.on("GetActiveTask", function() {
        worker.port.emit("ActiveTaskLoaded", activeTask);
      });

      /**
       * Returns the latest active task.
       * Hint: emit on "LatestLogEntriesLoaded"
       */
      worker.port.on("GetLatestActiveTask", function() {
        services.getLogEntries(worker, {
          "userId": JSON.parse(activeUser)._id,
          "action": "task_selected",
          "limit": 1
        });
      });

      /////////////////////////////////////////////////////////////////////////////
      // TASK: NOTES                                                             //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all notes regarding to the selected task.
       */
      worker.port.on("LoadNotes", function(task) {
        services.loadNotes(worker, task._id);          
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
        services.loadBookmarks(worker, task._id);
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

      /**
       * Be aware of all bookmarks from the active task
       */
      worker.port.on("SetActiveTaskBookmarks", function(bookmarks) {
        taskBookmarks = bookmarks;

        if (activeTask && tabs && tabs.activeTab) {
          showBookmarkedPage(tabs.activeTab.url);
        }
      });

      /////////////////////////////////////////////////////////////////////////////
      // TASK: HISTORY                                                           //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads history of selected task.
       */
      worker.port.on("LoadHistory", function(task) {
        services.loadHistory(worker, task._id);
      });
            
      /////////////////////////////////////////////////////////////////////////////
      // TASK: SEARCH HISTORY                                                    //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads history of selected task.
       */
      worker.port.on("LoadSearchHistory", function(task) {
        services.getAllQueriesFromLog(worker, task._id);
      });


      /////////////////////////////////////////////////////////////////////////////
      // TASK: TABS                                                              //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads the stored tabs of a given task.
       */
      worker.port.on("LoadTabs", function(task) {
        services.loadTabs(worker, task._id);
      });
            
      /**
       * Restores the given tabs.
       */
      worker.port.on("StoreTabs", function(tab) {
        for (let tab of tabs) {
          saveTab(tab, false);
        }
        
        // reload all tabs
        services.loadTabs(worker, activeTask._id);
      });
      
      /**
       * Restores the given tabs.
       */
      worker.port.on("RestoreTab", function(tab) {
        let opened = false;
        
        for (let t of tabs) {
          if (t.url === JSON.parse(tab).url) {
            opened = true;
            // console.log(JSON.parse(tab).url + " is already open");
          }        
        }
        
        if (!opened) {
          // console.log("Restoring tab with URL " + JSON.parse(tab).url + ".");
          
          tabs.open({
            url: JSON.parse(tab).url,
            inBackground: true,
            isPinned: (JSON.parse(tab).pinned === 'true')
          });

          addLogEntry({
            "userId": JSON.parse(activeUser)._id,
            "action": "tab_restored",
            "parameters": [
              {
                "key": "taskId",
                "value": activeTask._id
              },
              {
                "key": "tabUrl",
                "value": JSON.parse(tab).url
              }
            ]
          });
        }      
      });
      
      /**
       * Deletes an existing tab.
       */
      worker.port.on("DeleteTab", function(tab) {
        // Delete a tab
        services.deleteLogEntry(worker, tab._id);
        
        // Reload all tabs
        services.loadTabs(worker, activeTask._id);
      });
      
      /**
       * Be aware of all bookmarks from the active task
       */
      worker.port.on("SetActiveTaskTabs", function(tabs) {
        taskTabs = tabs;
        
        // On tabs reload refresh the context menu
        toggleContextMenu();
      });
      
      /////////////////////////////////////////////////////////////////////////////
      // TASK: ATTACHMENT                                                        //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all attachments regarding to the selected task.
       */
      worker.port.on("LoadAttachments", function(task) {
        services.loadAttachments(worker, task._id);
      });

      /**
       * Adds a new attachment to the selected task.
       */
      worker.port.on("AddAttachment", function(task, data, filename, filetype) {
        services.addAttachment(worker, task._id, data, filename, filetype);  
      });

      /**
       * Deletes an existing attachment.
       */
      worker.port.on("DeleteAttachment", function(attachment) {
        services.deleteAttachment(worker, attachment._id);
      });

      /**
       * Downloads an existing attachment.
       */
      worker.port.on("DownloadAttachment", function(attachment) {
        if (attachment != null && attachment.filename != null) {          
          notify("Attachment Download", "Downloading the file '" + attachment.filename + "' to your desktop.")
          services.downloadAttachment(worker, attachment);
        }
      });

      /////////////////////////////////////////////////////////////////////////////
      // TASK: LOG                                                               //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all log entries of the user.
       */
      worker.port.on("LoadLogEntries", function(userId) {
        services.loadLogEntries(worker, userId);          
      });

      /**
       * Adds a new log entry.
       */
      worker.port.on("AddLogEntry", function(entry) {
        addLogEntry(entry);
      });

      /**
       * Saves changes to an existing log entry.
       */
      worker.port.on("UpdateLogEntry", function(entry) {
        services.updateLogEntry(worker, entry);
      });

      /**
       * Deletes an existing log entry.
       */
      worker.port.on("DeleteLogEntry", function(id) {
        services.deleteLogEntry(worker, id);
      });

      /////////////////////////////////////////////////////////////////////////////
      // HELP                                                                    //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Opens the help page of this addon.
       */
      worker.port.on("ShowHelp", function(queries) {
        var pageUrl = data.url("pages/help.html");
        tabs.open(pageUrl);
      });
      
    },
    onShow: function () {
    //  console.log("Showing sidebar"); 
      sidebarStatus = 'visible';
    },
    onHide: function () {
    //  console.log("Hiding sidebar");
      sidebarStatus = 'hidden';
    },
    onDetach: function () {
    //  console.log("Detaching sidebar");
    }
  });

  /*
   * THIS HACK ALLOWS US TO SET THE WIDTH OF THE SIDEBAR!
   */
  const { WindowTracker } = require('sdk/deprecated/window-utils');
  const { isBrowser, getMostRecentBrowserWindow, windows, isWindowPrivate } = require('sdk/window/utils');

  WindowTracker({
    onTrack: function (window) {
      if (!isBrowser(window))
        return;

      let sidebar = window.document.getElementById('sidebar');
      sidebar.setAttribute('style', 'min-width: 350px; width: 350px; max-width: 500px;');
    }
  });
}

/**
 * This function opens the sidebar and loads the Tasks Todo website.
 */
function toggleSideBar() {
  if (sidebarStatus === 'visible') {
    sidebar.hide();
  } else {
    sidebar.show();
  }
}

/**
 * Sets a page notification
 */
function notify(title, message) {
  notifications.notify({
    title: title,
    text: message
  });
}

/*
 * This function checks if the current URL is bookmarked in the current task
 */
function showBookmarkedPage(url) {
  if (url && taskBookmarks && taskBookmarks.length > 0) {
    taskBookmarks.forEach(function(bookmark) {
      if (bookmark.url && bookmark.url.replace(url, "").length == 0) {
        showPageNotification(BOOKMARK_MESSAGE);
        return true;
      }
    });      
  }
}

/*
 * This function sets a notification to a bookmarked webpage.
 */
function showPageNotification(message) {
  worker = tabs.activeTab.attach({
    contentScriptFile: [data.url("js/jquery-1.10.2.min.js"), data.url("firefox/page-mod.js")],
  });

  worker.port.emit("ShowPageNotification", message);
}

/*
 * This function removes a notification from a webpage.
 */
function hidePageNotification() {
  worker = tabs.activeTab.attach({
    contentScriptFile: [data.url("js/jquery-1.10.2.min.js"), data.url("firefox/page-mod.js")]
  });

  worker.port.emit("HidePageNotification");
}

/*
 * This function checks if the current URL is bookmarked in the current task
 */
function showSearchQueries(url) {
  if (activeTask != null && activeTask._id != null) {
    var provider = utils.getSearchProvider(url);

    if (provider != null && provider.length > 0) {
      worker = tabs.activeTab.attach({
        contentScriptFile: [data.url("js/jquery-1.10.2.min.js"), data.url("firefox/page-mod.js")]
      });

      services.getLatestQueriesFromLog(worker, {
       'taskId': activeTask._id, 
       'provider': provider
      });
    }
  }
}

/**
 * SHow latest search searches.
 */
function hideLatestQueries() {
  worker = tabs.activeTab.attach({
    contentScriptFile: [data.url("js/jquery-1.10.2.min.js"), data.url("firefox/page-mod.js")]
  });

  worker.port.emit("HideLatestQueries");
}

// ----------------------------------------------------------------------------

/**
 * Add bookmark
 */
function addBookmark(taskId, url, title, description, thumbnail) {
  var json = { 
    "taskId" : taskId,
    "url" : url,
    "title" : title, 
    "description" : description,
    "thumbnail" : thumbnail,
    "created" : new Date(),
    "modified" : null
  };

  // Add bookmark to task
  services.addBookmark(getActiveWorker(), JSON.stringify(json));
  
  // Load all task bookmarks 
  services.loadBookmarks(getActiveWorker(), activeTask._id);
}

/**
 * Add log event
 */
function addLogEntry(entry) {
  services.addLogEntry(getActiveWorker(), entry); 
}

/**
 * Add history entry
 */
function addHistoryEntry(entry) {
  // Add history entry as log event
  addLogEntry(entry);
  
  // Reload the list of history entries
  services.loadHistory(getActiveWorker(), activeTask._id);
}

/**
 * Add query
 */
function addQuery(query) {
  // Add query as log event
  addLogEntry(query);
  
  // Reload the list of queries
  services.getAllQueriesFromLog(getActiveWorker(), activeTask._id);
}

/**
 * Save an active tab.
 */
function saveTab(tab, reload) {
  if (tab != null && tab.url != undefined && tab.url !== "about:blank" && !utils.isTabAlreadyStored(tab.url, taskTabs)) {
    // Save tab to current task
    addLogEntry({
      "userId": JSON.parse(activeUser)._id,
      "action": "tab_stored",
      "parameters": [
        {
          "key": "taskId",
          "value": activeTask._id
        },
        {
          "key": "tabId",
          "value": tab.id
        },
        {
          "key": "tabTitle",
          "value": tab.title
        },
        {
          "key": "tabUrl",
          "value": tab.url
        },
        {
          "key": "tabIndex",
          "value": tab.index
        },
        {
          "key": "tabThumbnail",
          "value": tab.getThumbnail()
        },
        {
          "key": "tabPinned",
          "value": tab.isPinned
        }
      ]
    });

    if (reload) {
      services.loadTabs(getActiveWorker(), activeTask._id);
    }
  }
}

/**
 * Load a linked file as attachment
 */
function loadFileAsAttachment(taskId, url) {
  services.loadFileAsAttachment(getActiveWorker(), JSON.stringify({ "taskId" : taskId, "url" : url }));  
}
