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

var btnSetTabAsBookmark;
var btnAddTab;
var btnAddAllTabs;

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
      if (activeTask) {
        // Add note to datastore
        services.addNote(getActiveWorker(), { 
          "task" : activeTask._id,
          "body" : selectionText
        });
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
      if (activeTask) {
        // Add bookmark
        addBookmark(activeTask._id, link, link, "", tabs.activeTab.getThumbnail());
      }
    }
  });

  /**
   * Context menu: Store linked file as an attachment to the current task.
   
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
      if (activeTask) {
        // Load a linked file as attachment
        loadFileAsAttachment(activeTask._id, selectionText);
      }
    }
  });
  */
  
  /**
   */
  contextMenu.Item({
    label: "Add screenshot of visible viewport to my current task",
    context: [
      contextMenu.PageContext(),
      contextMenu.PredicateContext(function(data) { return (activeTask != undefined && activeTask != null && activeTask._id != null && utils.isUrl(tabs.activeTab.url)); }),
    ],
    contentScript: 'self.on("click", function () {' +
                   '  self.postMessage();' + 
                   '});',
    image: data.url("../data/img/icon24.png"),
    onMessage: function() {
      if (activeTask) {        
        var window = require('sdk/window/utils').getMostRecentBrowserWindow();
        var tab = require('sdk/tabs/utils').getActiveTab(window);
        var myData;
        tabs.activeTab.attach({
          contentScript: "self.postMessage();", // recieves the total scroll height of tab
          onMessage: function() {
            var thumbnail = window.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
            window = tab.linkedBrowser.contentWindow;
            thumbnail.width = window.screen.availWidth;
            thumbnail.height = window.screen.availHeight;
            var ctx = thumbnail.getContext("2d");
            var snippetWidth = window.outerWidth;
            var snippetHeight = window.outerHeight;
            ctx.canvas.left  = 0;
            ctx.canvas.top = 0;
            ctx.canvas.width  = window.innerWidth;
            ctx.canvas.height = window.innerHeight;
            ctx.drawWindow(window, 0, 0, snippetWidth, snippetHeight, "rgb(255,255,255)");

            var imageDataUri=thumbnail.toDataURL('image/png');
            
            // Store data to the database
            services.addScreenshot(getActiveWorker(), activeTask._id, imageDataUri);
          }
        });
      }
    }
  });
  
  /**
   */
  contextMenu.Item({
    label: "Add screenshot of entire page to my current task",
    context: [
      contextMenu.PageContext(),
      contextMenu.PredicateContext(function(data) { return (activeTask != undefined && activeTask != null && activeTask._id != null && utils.isUrl(tabs.activeTab.url)); }),
    ],
    contentScript: 'self.on("click", function () {' +
                   '  self.postMessage();' + 
                   '});',
    image: data.url("../data/img/icon24.png"),
    onMessage: function() {
      if (activeTask) {        
        var window = require('sdk/window/utils').getMostRecentBrowserWindow();
        var tab = require('sdk/tabs/utils').getActiveTab(window);
        var myData;
        tabs.activeTab.attach({
          contentScript: "self.postMessage(document.body.scrollHeight);", // recieves the total scroll height of tab
          onMessage: function(scrollHeight) {
            var thumbnail = window.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
            window = tab.linkedBrowser.contentWindow;
            thumbnail.width = window.screen.availWidth;
            thumbnail.height = window.screen.availHeight;
            var ctx = thumbnail.getContext("2d");
            var snippetWidth = window.outerWidth;
            var snippetHeight = window.outerHeight;
            ctx.canvas.left  = 0;
            ctx.canvas.top = 0;
            ctx.canvas.width  = window.innerWidth;
            ctx.canvas.height = scrollHeight; // canvas height is made equal to the scroll height of window
            ctx.drawWindow(window, 0, 0, snippetWidth, snippetHeight+scrollHeight, "rgb(255,255,255)");

            var imageDataUri=thumbnail.toDataURL('image/png');
            
            // Store data to the database
            services.addScreenshot(getActiveWorker(), activeTask._id, imageDataUri);
          }
        });
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
      contextMenu.PredicateContext(function(data) { return (activeTask != undefined && activeTask != null && activeTask._id != null && utils.isUrl(tabs.activeTab.url) && !utils.isPageAlreadyBookmarked(tabs.activeTab.url, taskBookmarks)); }),
    ],
    contentScript: 'self.on("click", function () {' +
                   '  self.postMessage();' + 
                   '});',
    image: data.url("../data/img/icon24.png"),
    onMessage: function() {
      if (activeTask) {
        // Add bookmark
        addBookmark(activeTask._id, tabs.activeTab.url, tabs.activeTab.title, "", tabs.activeTab.getThumbnail());

        // Show bookmark notification on page
        enableBookmarkNotification();
      }
    }
  });
  
  btnSetTabAsBookmark = require("menuitem").Menuitem({
    id: "tt-set-tab-as-bookmark",
    menuid: "tabContextMenu",
    image: data.url("./../data/img/icon24.png"),
    label: "Add this page to my task bookmarks",
    disabled: true,
    onCommand: function() {
      if (activeTask) {
        // Add bookmark
        addBookmark(activeTask._id, tabs.activeTab.url, tabs.activeTab.title, "", tabs.activeTab.getThumbnail());

        // Show bookmark notification on page
        enableBookmarkNotification();
      }
    }
  });
  
  btnAddTab = require("menuitem").Menuitem({
    id: "tt-add-tab-to-task",
    menuid: "tabContextMenu",
    image: data.url("./../data/img/icon24.png"),
    label: "Add this tab to my task",
    disabled: true,
    onCommand: function() {
      if (activeTask) {
        // Store active tab
        saveTab(tabs.activeTab, false);
        // (Re-)Load all tabs
        services.getTabsFromLog(getActiveWorker(), activeTask._id);
      }
    }
  });
  
  btnAddAllTabs = require("menuitem").Menuitem({
    id: "tt-add-all-tabs-to-task",
    menuid: "tabContextMenu",
    image: data.url("./../data/img/icon24.png"),
    label: "Add all tabs to my task",
    disabled: true,
    onCommand: function() {
      if (activeTask) {
        for (let tab of tabs) {
          // Store tab
          saveTab(tab);
        }

        // (Re-)Load all tabs
        services.getTabsFromLog(getActiveWorker(), activeTask._id);
      }
    }
  });
  
  // Insert menu seperations
  let menu = doc.getElementById("tabContextMenu");
  menu.insertBefore(doc.createElement("menuseparator"), doc.getElementById("tt-set-tab-as-bookmark"));
  menu.insertBefore(doc.createElement("menuseparator"), doc.getElementById("tt-add-tab-to-task"));
}

/**
 * Toggles the context menu for state change
 */
function toggleContextMenu() {
  btnSetTabAsBookmark.disabled = (!activeTask || !activeTask._id || !tabs.activeTab || !tabs.activeTab.url || !utils.isUrl(tabs.activeTab.url) || utils.isPageAlreadyBookmarked(tabs.activeTab.url, taskBookmarks));
  btnAddTab.disabled = (!activeTask || !activeTask._id || !tabs.activeTab || !tabs.activeTab.url || !utils.isUrl(tabs.activeTab.url) || utils.isTabAlreadyStored(tabs.activeTab.url, taskTabs));
  btnAddAllTabs.disabled = (!activeTask || !activeTask._id || !tabs.activeTab || !tabs.activeTab.url || !utils.isUrl(tabs.activeTab.url) || tabs.length <= 1);
};

/**
 * Track page load for task history
 */
var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
var mainWindow = wm.getMostRecentWindow("navigator:browser");
var gBrowser = mainWindow.gBrowser;
var location = "";
var locationChanged = false;

var tabsProgressListener = {
  onProgressChange: function(aBrowser, aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {
  },

  onLocationChange: function(aProgress, aRequest, aURI, aFlag) {
    location = aFlag.spec;
    locationChanged = true;
    console.log("On location change: " + location);
  },

  onStateChange: function(aBrowser, aWebProgress, aRequest, aFlag, aStatus) { 
    if (locationChanged || (aFlag & Ci.nsIWebProgressListener.STATE_STOP) && (aFlag & Ci.nsIWebProgressListener.STATE_IS_NETWORK)) {
      console.log("Finished loading page: " + location);

      // Handle location change!
      onLocationChange(location);
      locationChanged = false;
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

gBrowser.removeTabsProgressListener(tabsProgressListener); // first
gBrowser.addTabsProgressListener(tabsProgressListener); // second ... don't know why

/**
 * Handle location changes (e.g. track history or check bookmarks)
 */ 
var lastProvider = "";
var lastQuery = "";

function onLocationChange(url) {
  if (url && utils.isUrl(url)) {
    // Add history entry
    addHistoryEntry({
      "action": "location_change",
      "parameters": [
        {
          "key": "goalId",
          "value": activeGoal._id
        },
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
          "value": gBrowser.contentDocument.body != null ? gBrowser.contentDocument.body.innerHTML : ""
        }
      ]
    });

    var provider = utils.getSearchProvider(url);
    var query = utils.getQueryString(url);

    console.log("Query: " + query);
    
    if (provider != null && query != null && provider.length > 0 && query.length > 0) {
      if (provider.replace(lastProvider, "").length != 0 || query.replace(lastQuery, "").length != 0) {
        // if search query is executed
        addQuery({
          "action": "search_executed",
          "parameters": [
            {
              "key": "goalId",
              "value": activeGoal._id
            },
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
  }
}

/**
 * Observer to set goal and task titles as parameter to the request header.
 */
var httpRequestObserver =
{
  observe: function(subject, topic, data) 
  {
    if (topic == "http-on-modify-request") {
      var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);

      if (activeGoal && activeGoal._id) {
        httpChannel.setRequestHeader("X-Goal", activeGoal.title, false);
      } 
      
      if (activeTask && activeTask._id) {
        httpChannel.setRequestHeader("X-Task", activeTask.title, false);
      }      
    }
  }
};

var observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
observerService.addObserver(httpRequestObserver, "http-on-modify-request", false);

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
    url: data.url("goals.html"),

    onAttach: function (worker) {
      // Add sidebar worker to the workers array
      workers.push(worker);
      worker.on("detach", function() {
        var index = workers.indexOf(worker);
        if (index >= 0) workers.splice(index, 1);
      });
      
      /////////////////////////////////////////////////////////////////////////////
      // TASKSTODO EVENT TRACKING                                                //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Redirects to a certain page.
       */
      worker.port.on("TrackEvent", function(eventType, eventId) {
        if (eventType && eventId) {
          console.log("Triggered event " + eventType + " on " + eventId); 
          
          addLogEntry({
            "action": "user_event",
            "parameters": [
              {
                "key": "type",
                "value": eventType
              },
              {
                "key": "target",
                "value": eventId
              }
            ]
          });
        }
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
      // GOALS                                                                   //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all goals.
       */
      worker.port.on("LoadGoals", function() {
        services.loadGoals(worker);
      });
            
      /**
       * Load a specific goal.
       */
      worker.port.on("LoadGoal", function(goalId) {
        services.loadGoal(worker, goalId);
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
        services.deleteGoal(worker, goal._id);
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
            "action": "goal_deselected",
            "parameters": [
              {
                "key": "goalId",
                "value": activeGoal._id
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
        if (activeGoal) {
          worker.port.emit("ActiveGoalLoaded", activeGoal);
        }
      });
      
      /**
       * Returns the latest active goal.
       */
      worker.port.on("GetLatestActiveGoal", function() {
        services.getLatestGoalFromLog(worker);
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
        services.deleteTask(worker, task._id);
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
            "action": "task_selected",
            "parameters": [
              {
                "key": "taskId",
                "value": task._id
              },
              {
                "key": "goalId",
                "value": activeGoal._id
              }
            ]
          });
        } else {
          var msg = "The task '" + activeTask.title + "' has been deselected!";
          console.log(msg);
          notify("Task deselected", msg);
          
          addLogEntry({
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

        // Reset arrays
        taskBookmarks = [];
        taskTabs = [];
        taskHistory = [];
        
        // Disable web search adaptions
        disableWebSearchAdaptions();
                
        // Disable bookmark notification
        disableBookmarkNotification();
        
        // Toggle the context menu
        toggleContextMenu();
      });

      /**
       * Return active task.
       */
      worker.port.on("GetActiveTask", function() {
        if (activeTask) {
          worker.port.emit("ActiveTaskLoaded", activeTask);
        }
      });

      /**
       * Returns the latest active task.
       */
      worker.port.on("GetLatestActiveTask", function() {
        services.getLatestTaskFromLog(worker);
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
        services.deleteNote(worker, note._id);
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
        services.deleteBookmark(worker, bookmark._id);
      });

      /**
       * Be aware of all bookmarks from the active task
       */
      worker.port.on("SetActiveTaskBookmarks", function(bookmarks) {
        // Set task bookmarks
        taskBookmarks = bookmarks;
        
        // Enable web search adaptions
        enableWebSearchAdaptions();

        // Enable bookmark notification
        enableBookmarkNotification();

        // Toggle the context menu
        toggleContextMenu();
      });

      /////////////////////////////////////////////////////////////////////////////
      // TASK: HISTORY                                                           //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads history of selected task.
       */
      worker.port.on("LoadHistory", function(task) {
        services.getBrowsingHistory(worker, task._id);
      });
      
      /**
       * Be aware of the browsing history
       */
      worker.port.on("SetActiveTaskHistory", function(history) {      
        // Set active task history
        taskHistory = history;
        
        // Enable web search adaptions
        enableWebSearchAdaptions();

        // Enable bookmark notification
        enableBookmarkNotification();

        // Toggle the context menu
        toggleContextMenu();
      });
            
      /**
       * Clear the browse history of a given task.
       */
      worker.port.on("ClearBrowseHistory", function(taskId) {
        services.removeBrowseHistory(worker, taskId);
      });
      
      /////////////////////////////////////////////////////////////////////////////
      // TASK: SEARCH HISTORY                                                    //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads history of selected task.
       */
      worker.port.on("LoadSearchHistory", function(task) {
        services.getSearchQueriesByTask(worker, task._id);
      });
      
      /**
       * Clear the search history of a given task.
       */
      worker.port.on("ClearSearchHistory", function(taskId) {
        services.removeSearchHistory(worker, taskId);
      });

      /////////////////////////////////////////////////////////////////////////////
      // TASK: TABS                                                              //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads the stored tabs of a given task.
       */
      worker.port.on("LoadTabs", function(task) {
        // Load all tabs
        services.getTabsFromLog(worker, task._id);
      });
            
      /**
       * Restores the given tabs.
       */
      worker.port.on("StoreTabs", function() {
        for (let tab of tabs) {
          // Save tab
          saveTab(tab);
        }
        
        // (Re-)Load all tabs
        services.getTabsFromLog(worker, activeTask._id);
      });
      
      /**
       * Restores the given tabs.
       */
      worker.port.on("RestoreTab", function(tab) {
        let opened = false;
        
        for (let t of tabs) {
          if (t.url === JSON.parse(tab).url) {
            opened = true;
          }        
        }
        
        if (!opened) {          
          tabs.open({
            url: JSON.parse(tab).url,
            inBackground: true,
            isPinned: (JSON.parse(tab).pinned === 'true')
          });

          addLogEntry({
            "action": "tab_restored",
            "parameters": [
              {
                "key": "goalId",
                "value": activeGoal._id
              },
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
        services.getTabsFromLog(worker, activeTask._id);
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
      // TASK: SCREENSHOTS                                                       //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all screenshots regarding to the selected task.
       */
      worker.port.on("LoadScreenshots", function(task) {
        services.loadScreenshots(worker, task._id);
      });

      /**
       * Deletes an existing screenshot.
       */
      worker.port.on("DeleteScreenshot", function(screenshot) {
        services.deleteScreenshot(worker, screenshot._id);
      });

      /**
       * Downloads an existing screenshot.
       */
      worker.port.on("OpenScreenshot", function(screenshot) {      
        tabs.open({
          url: data.url(screenshot.image),
          inBackground: false
        });
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
      /*worker.port.on("DownloadAttachment", function(attachment) {
        if (attachment != null && attachment.filename != null) {          
          notify("Attachment Download", "Downloading the file '" + attachment.filename + "' to your desktop.")
          services.downloadAttachment(worker, attachment);
        }
      });*/

      /////////////////////////////////////////////////////////////////////////////
      // TASK: LOG                                                               //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all log entries.
       */
      worker.port.on("LoadLogEntries", function() {
        services.getAllLogEntries(worker);          
      });

      /**
       * Adds a new log entry.
       */
      worker.port.on("AddLogEntry", function(entry) {
        addLogEntry(entry);
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
        var pageUrl = data.url("help.html");
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

    addLogEntry({
      "action": "show_sidebar",
      "parameters": [
        {
          "key": "visible",
          "value": "false"
        }
      ]
    });
    
  } else {
    sidebar.show();

    addLogEntry({
      "action": "show_sidebar",
      "parameters": [
        {
          "key": "visible",
          "value": "true"
        }
      ]
    });
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

// ----------------------------------------------------------------------------

/*
 * This function sets a notification to a bookmarked webpage.
 */
function enableBookmarkNotification() {  
  if (activeGoal && activeTask && activeGoal._id && activeTask._id && taskBookmarks && taskBookmarks.length > 0) {
    console.log("Enable bookmark notifications");

    taskBookmarks.forEach(function(bookmark) {
      if (bookmark.url) {
        // Get the browser tabs with the bookmark URL
        var tArray = utils.findTabByUrl(bookmark.url, tabs);
                
        if (tArray && tArray.length > 0) {
          Array.forEach(tArray, function (tab) {
            worker = tab.attach({ 
              contentScriptFile: [data.url("js/jquery/jquery-1.11.3.min.js"), data.url("firefox/page-mod.js")],
            });
          });

          worker.port.emit("ShowBookmarkNotification", BOOKMARK_MESSAGE);
          return;
        }
      }
    });      
  }
}

/*
 * This function removes a notification from a webpage.
 */
function disableBookmarkNotification() {
  Array.forEach(tabs, function (tab) {
    worker = tab.attach({ 
      contentScriptFile: [data.url("js/jquery/jquery-1.11.3.min.js"), data.url("firefox/page-mod.js")],
    });
  });
  
  worker.port.emit("HideBookmarkNotification");
}

/*
 * Show task-related web search adaptions like notifications and recommendations.
 */
function enableWebSearchAdaptions() {
  if (activeGoal && activeTask && activeGoal._id && activeTask._id) {
    console.log("Enable web search adaptions");
    
    Array.forEach(tabs, function(tab) {
      var provider = utils.getSearchProvider(tab.url);
      var query = utils.getQueryString(tab.url);

      if (provider && provider.length > 0) {
        worker = tab.attach({
          contentScriptFile: [data.url("js/jquery/jquery-1.11.3.min.js"), data.url("firefox/page-mod.js")]
        });

        // Get the latest queries from log (this results in an event call!)
        services.getSearchQueriesByTaskAndProvider(worker, activeTask._id, provider);

        // Shows query suggestions
        services.getQuerySuggestions(worker, "Google", provider, query);
        
        // Shows the bookmark notifications in the search result
        worker.port.emit("ShowBookmarksInSearchResult", provider, taskHistory, taskBookmarks);
      }
    });
  }
}

/**
 * Hide task-related web search adaptions like notifications and recommendations.
 */
function disableWebSearchAdaptions() {
  Array.forEach(tabs, function (tab) {
    worker = tab.attach({ 
      contentScriptFile: [data.url("js/jquery/jquery-1.11.3.min.js"), data.url("firefox/page-mod.js")],
    });
  });

  // Hides the latest search queries
  worker.port.emit("HideLatestQueries");
  
  // Hides the latest search queries
  worker.port.emit("HideQuerySuggestions");
  
  // Hides the bookmark notifications in the search result
  worker.port.emit("HideBookmarksInSearchResult");
}

// ----------------------------------------------------------------------------

/**
 * Add bookmark
 */
function addBookmark(taskId, url, title, description, thumbnail) {
  var bookmark = { 
    "task": taskId,
    "url": url,
    "title": title, 
    "description": description,
    "thumbnail": thumbnail,
    "content": null
  };

  // Add bookmark to task
  services.addBookmark(getActiveWorker(), bookmark);
  
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
  services.getBrowsingHistory(getActiveWorker(), activeTask._id);
}

/**
 * Add query
 */
function addQuery(query) {
  // Add query as log event
  addLogEntry(query);
  
  // Reload the list of queries
  services.getSearchQueriesByTask(getActiveWorker(), activeTask._id);
}

/**
 * Save an active tab.
 */
function saveTab(tab) {
  if (tab != null && utils.isUrl(tab.url) && !utils.isTabAlreadyStored(tab.url, taskTabs)) {
    // Save tab to current task
    addLogEntry({
      "action": "tab_stored",
      "parameters": [
        {
          "key": "goalId",
          "value": activeTask._id
        },
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
  }
}

/**
 * Load a linked file as attachment

function loadFileAsAttachment(taskId, url) {
  services.loadFileAsAttachment(getActiveWorker(), JSON.stringify({ "taskId" : taskId, "url" : url }));  
}
*/