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
const { modelFor } = require("sdk/model/core");
const services = require("./services");
const utils = require("./utils");
const ss = require("sdk/simple-storage");

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

/**
 * Constructor, called when add-on gets installed or activated.
 */
exports.main = function(options, callbacks) {
  if (options.loadReason == "install" || options.loadReason == "startup") {
    // Set a new icon to the toolbar
    addToolbarButton();
    
    // Initialize sidebar
    initializeSidebar();

    // Initialize context menu
    initializeContextMenu();
  }
};

/**
 * Destructor, called when add-on gets uninstalled or deactivated.
 */
exports.onUnload = function(reason) {
  if (reason == "uninstall" || reason == "disable") {
    removeToolbarButton();
  } else if (reason == "shutdown") {
    if (sidebar) {
     // sidebar.hide();
    }
  }
};

/**
 * This function adds the icon to the toolbar.
 */
function addToolbarButton() {
  var button = ActionButton({
    id: "btn-taskstodo",
    label: "TasksTodo",
    image: data.url("img/icon24.png"),
    icon: {
      "16": "./img/icon24.png",
      "32": "./img/icon32.png"
    },
    onClick: toggleSideBar
  });
  /*
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
    btn.setAttribute('label', 'My App');
    btn.addEventListener('click', function() {
        // use tabs.activeTab.attach() to execute scripts in the context of the browser tab
        console.log('clicked');
    }, false)
    navBar.appendChild(btn);*/
}

/**
 * This function removes the icon from the toolbar.
 */
function removeToolbarButton() {
}

/**
 * This function creates the sidebar.
 */
function initializeSidebar() {
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
          console.log("LOG: Triggered event " + eventType + " on " + eventId); 
          
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
      // GOAL: NOTES                                                             //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all notes regarding to the selected goal.
       */
      worker.port.on("LoadGoalNotes", function(goal) {
        services.loadGoalNotes(worker, goal._id);          
      });

      /**
       * Adds a new note to the selected goal.
       */
      worker.port.on("AddGoalNote", function(note) {
        services.addGoalNote(worker, note);
      });

      /**
       * Saves changes to an existing note.
       */
      worker.port.on("UpdateGoalNote", function(note) {
        services.updateGoalNote(worker, note);
      });

      /**
       * Deletes an existing note.
       */
      worker.port.on("DeleteGoalNote", function(note) {
        services.deleteGoalNote(worker, note._id);
      });
      
      /////////////////////////////////////////////////////////////////////////////
      // GOAL: SUMMARY                                                           //
      /////////////////////////////////////////////////////////////////////////////
      
      /**
       * Loads the goal summary.
       */
      worker.port.on("LoadGoalSummary", function(goal) {
        services.loadGoalSummary(worker, goal._id);
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

        // Reset local storage
        ss.storage.bookmarks = [];
        ss.storage.history = [];
        ss.storage.tabs = [];
        ss.storage.suggestions = null;
        
        // Remove notification layer on bookmarked pages
        hideBookmarkNotifications();
        
        // Remove all highlighted pages in search results
        hideBookmarksInSearchResults();
        hideVisitedPagesInSearchResults();
 
        // Hide search support windows
        hideSearchSupportWindows();
        
        // Toggle the context menu
        toggleBrowserTopMenu();
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
        ss.storage.bookmarks = bookmarks;
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
        ss.storage.history = history;
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
        ss.storage.tabs = tabs;
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
  if (sidebar != null) {
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
}

/**
 * Sets a page notification
 */
function notify(title, message) {
  /*notifications.notify({
    title: title,
    text: message
  });*/
}

/**
 * Returns the active worker, which is used for interscript communication
 */ 
function getActiveWorker() {
  return workers[0];
}

/**
 * This function adds context sensitive right click menu entries.
 */ 
function initializeContextMenu() {

  /**
   * CONTEXT MENU: Saves the selected text as note to the current task.
   */ 
  contextMenu.Item({
    label: "Save text selection as note to my task",
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
          "goal" : null, // add task note
          "task" : activeTask._id,
          "body" : selectionText
        });
      }
    }
  });
  
  /**
   * CONTEXT MENU: Saves the linked page as bookmark to the current task.
   */
  contextMenu.Item({
    label: "Save linked page as bookmark to my task",
    context: [
      contextMenu.SelectorContext('a[href]'),
      contextMenu.PredicateContext(function(data) { return (activeTask != undefined && activeTask != null && activeTask._id != null && !utils.isPageAlreadyBookmarked(data.documentURL, ss.storage.bookmarks)); }),
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
   * CONTEXT MENU: Saves a screenshot of the visible viewport of the page to the current task.
   */
  contextMenu.Item({
    label: "Save screenshot of viewport to my task",
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
   * CONTEXT MENU: Saves a screenshot of the entire page to the current task.
   */
  contextMenu.Item({
    label: "Save screenshot of entire page to my task",
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
   * CONTEXT MENU: Saves the page as bookmark to the current task.
   */
  contextMenu.Item({
    label: "Save page as bookmark to my task",
    context: [
      contextMenu.PageContext(),
      contextMenu.PredicateContext(function(data) { return (activeTask != undefined && activeTask != null && activeTask._id != null && utils.isUrl(tabs.activeTab.url) && !utils.isPageAlreadyBookmarked(tabs.activeTab.url, ss.storage.bookmarks)); }),
    ],
    contentScript: 'self.on("click", function () {' +
                   '  self.postMessage();' + 
                   '});',
    image: data.url("../data/img/icon24.png"),
    onMessage: function() {
      if (activeTask) {
        // Add bookmark
        addBookmark(activeTask._id, tabs.activeTab.url, tabs.activeTab.title, "", tabs.activeTab.getThumbnail());
      }
    }
  });
  
  /**
   * TOP MENU ITEM: Saves the page as bookmark to the current task.
   */
  btnSetTabAsBookmark = require("menuitem").Menuitem({
    id: "tt-set-tab-as-bookmark",
    menuid: "tabContextMenu",
    image: data.url("./../data/img/icon24.png"),
    label: "Save page as bookmark to my task",
    disabled: true,
    onCommand: function() {
      if (activeTask) {
        // Add bookmark
        addBookmark(activeTask._id, tabs.activeTab.url, tabs.activeTab.title, "", tabs.activeTab.getThumbnail());
      }
    }
  });
  
  /**
   * TOP MENU ITEM: Saves the actual tab to the current task.
   */
  btnAddTab = require("menuitem").Menuitem({
    id: "tt-add-tab-to-task",
    menuid: "tabContextMenu",
    image: data.url("./../data/img/icon24.png"),
    label: "Save actual tab to my task",
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
  
  /**
   * TOP MENU ITEM: Saves all tabs to the current task.
   */
  btnAddAllTabs = require("menuitem").Menuitem({
    id: "tt-add-all-tabs-to-task",
    menuid: "tabContextMenu",
    image: data.url("./../data/img/icon24.png"),
    label: "Save all tabs to my task",
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
function toggleBrowserTopMenu() {
  console.log("Toggle browser top menu");
  btnSetTabAsBookmark.disabled = (!activeTask || !activeTask._id || !tabs.activeTab || !tabs.activeTab.url || !utils.isUrl(tabs.activeTab.url) || utils.isPageAlreadyBookmarked(tabs.activeTab.url, ss.storage.bookmarks));
  btnAddTab.disabled = (!activeTask || !activeTask._id || !tabs.activeTab || !tabs.activeTab.url || !utils.isUrl(tabs.activeTab.url) || utils.isTabAlreadyStored(tabs.activeTab.url, ss.storage.tabs));
  btnAddAllTabs.disabled = (!activeTask || !activeTask._id || !tabs.activeTab || !tabs.activeTab.url || !utils.isUrl(tabs.activeTab.url) || tabs.length <= 1);
};

/**
 * Tab listener for logging purposes
 *
tabs.on('open', function onOpen(tab) {
  if (tab && (tab.url === "about:newtab" || tab.url === "about:blank")) {
    console.log('New tab opened');
  } else {
    console.log('Tab opened', tab.title, tab.url);
  }
});

// Listen for tab content loads.
tabs.on('ready', function(tab) {
  if (tab && (tab.url !== "about:newtab" && tab.url !== "about:blank")) {
    console.log('Tab loaded', tab.title, tab.url);
  }
});

// Listen for tab content loads.
tabs.on('select', function(tab) {
  if (tab && (tab.url !== "about:newtab" && tab.url !== "about:blank")) {
    console.log('Tab selected', tab.title, tab.url);
  }
});
*/

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
    // State transition flags
    let isStart = aFlag & Ci.nsIWebProgressListener.STATE_START;
    let isRedirecting = aFlag & Ci.nsIWebProgressListener.STATE_REDIRECTING;
    let isTransferring = aFlag & Ci.nsIWebProgressListener.STATE_TRANSFERRING;
    let isNegotiating = aFlag & Ci.nsIWebProgressListener.STATE_NEGOTIATING;
    let isStop = aFlag & Ci.nsIWebProgressListener.STATE_STOP;
    
    // State type flags
    let isRequest = aFlag & Ci.nsIWebProgressListener.STATE_IS_REQUEST;
    let isDocument = aFlag & Ci.nsIWebProgressListener.STATE_IS_DOCUMENT;
    let isNetwork = aFlag & Ci.nsIWebProgressListener.STATE_IS_NETWORK;
    let isWindow = aFlag & Ci.nsIWebProgressListener.STATE_IS_WINDOW;

    // Location Change flags
    let isLocationChangeSameDocument = aFlag & Ci.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT;

    /*console.log(
      "onStateChange for " + location,
      ": isStart: " + !!isStart,
      ", isRedirecting: " + !!isRedirecting,
      ", isTransferring: " + !!isTransferring,
      ", isNegotiating: " + !!isNegotiating,
      ", isStop: " + !!isStop,
      ", isRequest: " + !!isRequest,
      ", isDocument: " + !!isDocument,
      ", isNetwork: " + !!isNetwork,
      ", isWindow: " + !!isWindow,
      ", isLocationChangeSameDocument: " + !!isLocationChangeSameDocument
    );*/

    if (locationChanged && !!isStop) {
      var urlexp = new RegExp('(http|https)://www\.google\.(de|com)/url\?'); // Filter Google redirects on query results
          
      if (location !== "about:newtab" && location.startsWith("http") && !location.match(/(http|https):\/\/www\.google\.(de|com)\/url\?/gi)) {
        console.log("Finished loading page: " + location);

        // Add history entry
        addHistoryEntry(location);
        
        // Add search query entry
        addQuery(location);
 
        // Set notification layer on bookmarked pages 
        showBookmarkNotifications();
        
        // Show the search support features
        showSearchSupportWindows();
      }

      // Reset flag
      locationChanged = false;
    }
  },

  onDownloadStateChange: function(aState, aDownload) {
  }
};

gBrowser.removeTabsProgressListener(tabsProgressListener); // first
gBrowser.addTabsProgressListener(tabsProgressListener); // second ... don't know why

/**
 * Observer to set goal and task titles as parameter to the request header.
 */
var httpRequestObserver =
{
  observe: function(subject, topic, data) 
  {
    if (topic == "http-on-modify-request") {
      var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);

      if (activeGoal && activeGoal._id && activeGoal.title) {
        httpChannel.setRequestHeader("X-Goal", activeGoal.title, false);
      } 
      
      if (activeTask && activeTask._id && activeTask.title) {
        httpChannel.setRequestHeader("X-Task", activeTask.title, false);
      }      
    }
  }
};

var observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
observerService.addObserver(httpRequestObserver, "http-on-modify-request", false);

// ----------------------------------------------------------------------------

var { setInterval } = require("sdk/timers");
setInterval(function() {
  if (activeGoal && activeTask) {
    // Highlight visited pages in search results
    showVisitedPagesInSearchResults();

    // Highlight bookmarked pages in search results
    showBookmarksInSearchResults();

    // Set notification layer for bookmarked pages 
    showBookmarkNotifications();
    
    // Toggle the top menu items
    toggleBrowserTopMenu();    
  }
}, 2000)

/*
 * This function sets a notification to a bookmarked webpage.
 */
function showBookmarkNotifications() {  
  if (activeGoal && activeTask && activeGoal._id && activeTask._id && ss.storage.bookmarks && ss.storage.bookmarks.length > 0) {
    ss.storage.bookmarks.forEach(function(bookmark) {
      if (bookmark.url) {
        // Get the browser tabs with the bookmark URL
        var tArray = utils.findTabByUrl(bookmark.url, tabs);
                
        if (tArray && tArray.length > 0) {
          Array.forEach(tArray, function (tab) {
            worker = tab.attach({ 
              contentScriptFile: [data.url("js/jquery/jquery-1.11.3.min.js"), data.url("firefox/page-mod.js")],
            });
          });

          worker.port.emit("ShowBookmarkNotifications", BOOKMARK_MESSAGE);
          return;
        }
      }
    });      
  }
}

/*
 * This function removes a notification from a webpage.
 */
function hideBookmarkNotifications() {
  Array.forEach(tabs, function (tab) {
    worker = tab.attach({ 
      contentScriptFile: [data.url("js/jquery/jquery-1.11.3.min.js"), data.url("firefox/page-mod.js")],
    });
  });
  
  console.log("Hide bookmark notifications");
  worker.port.emit("HideBookmarkNotifications");
}

/**
 * 
 */
function showVisitedPagesInSearchResults() {
  if (activeGoal && activeTask && activeGoal._id && activeTask._id) {
    if (ss.storage.history && ss.storage.history.length > 0) {
      Array.forEach(tabs, function(tab) {
        var provider = utils.getSearchProvider(tab.url);

        if (provider && provider.length > 0) {
          if (provider.toUpperCase() === "GOOGLE" 
              || provider.toUpperCase() === "GOOGLE SCHOLAR" 
              || provider.toUpperCase() === "YOUTUBE" 
              || provider.toUpperCase() === "SOWIPORT") {
            console.log("Highlight visited pages in search result entries for provider " + provider);

            worker = tab.attach({
              contentScriptFile: [data.url("js/jquery/jquery-1.11.3.min.js"), data.url("firefox/page-mod.js")]
            });

            // Highlight all visited pages using the browsing history
            worker.port.emit("ShowVisitedPagesInSearchResult", provider, /*taskHistory*/ss.storage.history);
          } else {
            //console.error(provider + " not supported for result highlighting adaption!");
          }
        }
      });
    } else {
      console.log("No history entries in local storage!");
      hideVisitedPagesInSearchResults();
    }
  }
}

/**
 * 
 */
function hideVisitedPagesInSearchResults() {
  Array.forEach(tabs, function(tab) {
    var provider = utils.getSearchProvider(tab.url);

    if (provider && provider.length > 0) {
        if (provider.toUpperCase() === "GOOGLE" 
          || provider.toUpperCase() === "GOOGLE SCHOLAR" 
          || provider.toUpperCase() === "YOUTUBE" 
          || provider.toUpperCase() === "SOWIPORT") {
        console.log("Hide visited pages in search result entries for provider " + provider);

        worker = tab.attach({
          contentScriptFile: [data.url("js/jquery/jquery-1.11.3.min.js"), data.url("firefox/page-mod.js")]
        });

        // Disable the highlighting of visited pages in search result page
        worker.port.emit("HideVisitedPagesInSearchResult");
      }
    }
  });
}

/**
 * 
 */
function showBookmarksInSearchResults() {
  if (activeGoal && activeTask && activeGoal._id && activeTask._id) {
    if (ss.storage.bookmarks && ss.storage.bookmarks.length > 0) {
      Array.forEach(tabs, function(tab) {
        var provider = utils.getSearchProvider(tab.url);

        if (provider && provider.length > 0) {
          if (provider.toUpperCase() === "GOOGLE" 
              || provider.toUpperCase() === "GOOGLE SCHOLAR" 
              || provider.toUpperCase() === "YOUTUBE" 
              || provider.toUpperCase() === "SOWIPORT") {
            console.log("Highlight bookmarks in result entries for provider " + provider);

            worker = tab.attach({
              contentScriptFile: [data.url("js/jquery/jquery-1.11.3.min.js"), data.url("firefox/page-mod.js")]
            });

            // Highlight all bookmarked pages using the bookmarks
            worker.port.emit("ShowBookmarksInSearchResult", provider, ss.storage.bookmarks);
          } else {
            //console.error(provider + " not supported for result highlighting adaption!");
          }
        }
      });
    } else {
      console.log("No bookmarks in local storage!");
      hideBookmarksInSearchResults();
    }
  }
}

/**
 * 
 */
function hideBookmarksInSearchResults() {
  Array.forEach(tabs, function(tab) {
    var provider = utils.getSearchProvider(tab.url);

    if (provider && provider.length > 0) {
        if (provider.toUpperCase() === "GOOGLE" 
          || provider.toUpperCase() === "GOOGLE SCHOLAR" 
          || provider.toUpperCase() === "YOUTUBE" 
          || provider.toUpperCase() === "SOWIPORT") {
        console.log("Hide bookmarks result entries for provider " + provider);

        worker = tab.attach({
          contentScriptFile: [data.url("js/jquery/jquery-1.11.3.min.js"), data.url("firefox/page-mod.js")]
        });

        // Disable the highlighting of bookmarked pages in search result page
        worker.port.emit("HideBookmarksInSearchResult");
      }
    }
  });
}

/**
 * 
 */ 
function showSearchSupportWindows() {
  if (activeGoal && activeTask && activeGoal._id && activeTask._id) {
    Array.forEach(tabs, function(tab) {
      var provider = utils.getSearchProvider(tab.url);

      if (provider && provider.length > 0) {
          if (provider.toUpperCase() === "GOOGLE" 
            || provider.toUpperCase() === "GOOGLE SCHOLAR" 
            || provider.toUpperCase() === "YOUTUBE" 
            || provider.toUpperCase() === "SOWIPORT") {
          console.log("Show search support for provider " + provider);
          
          worker = tab.attach({
            contentScriptFile: [data.url("js/jquery/jquery-1.11.3.min.js"), data.url("firefox/page-mod.js")]
          });
          
          // Show the last executed search queries
          services.getSearchQueriesByTaskAndProvider(worker, activeTask._id, provider);
          
          // Show query suggestions according to the last query
          var query = utils.getQueryString(tab.url);

          if (ss.storage.suggestions || ss.storage.suggestions !== provider + "|" + query) {
            services.getQuerySuggestions(worker, "Google", provider, query);
            ss.storage.suggestions = provider + "|" + query;
          }
        } else {
          //console.error(provider + " not supported for search support adaption!");
        }
      }
    });
  }
}

/**
 * 
 */
function hideSearchSupportWindows() {
  Array.forEach(tabs, function(tab) {
    var provider = utils.getSearchProvider(tab.url);

    if (provider && provider.length > 0) {
        if (provider.toUpperCase() === "GOOGLE" 
          || provider.toUpperCase() === "GOOGLE SCHOLAR" 
          || provider.toUpperCase() === "YOUTUBE" 
          || provider.toUpperCase() === "SOWIPORT") {
        console.log("Hide search support for provider " + provider);

        worker = tab.attach({
          contentScriptFile: [data.url("js/jquery/jquery-1.11.3.min.js"), data.url("firefox/page-mod.js")]
        });

        // Hide the latest search queries
        worker.port.emit("HideLatestQueries");

        // Hide any query suggestions
        worker.port.emit("HideQuerySuggestions");
      }
    }
  });
}

// ----------------------------------------------------------------------------

var lastProvider = "";
var lastQuery = "";

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

  // Update local bookmarks (while reloading)
  ss.storage.bookmarks.push(bookmark);
  
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
function addHistoryEntry(url) {
  if (activeGoal && activeTask) {
    Array.forEach(tabs, function(tab) {
      if (tab && tab.url === url) {
        let entry = {
          "action": "location_change",
          "parameters": [
            {
              "key": "goalId",
              "value": activeGoal ? activeGoal._id : "none"
            },
            {
              "key": "taskId",
              "value": activeTask ? activeTask._id : "none"
            },
            {
              "key": "url",
              "value": url
            },
            {
              "key": "title",
              "value": tab.title
            },
            {
              "key": "thumbnail",
              "value": tab.getThumbnail()
            },
            {
              "key": "body",
              "value": "" //gBrowser.contentDocument.body != null ? gBrowser.contentDocument.body.innerHTML : ""
            }
          ]
        };

        // Update local history list (till reload is finished)
        ss.storage.history.push(entry);

        // Add history entry as log event
        addLogEntry(entry);

        // Reload the list of history entries
        services.getBrowsingHistory(getActiveWorker(), activeTask._id);
      }

      return;
    });
  }
}

/**
 * Add query
 */
function addQuery(url) {
  var provider = utils.getSearchProvider(url);
  var query = utils.getQueryString(url);
  
  if (provider != null && query != null && provider.length > 0 && query.length > 0) {
    console.log("Query: " + query);

    if (provider.replace(lastProvider, "").length != 0 || query.replace(lastQuery, "").length != 0) {
      let entry = {
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
      }

      // Add query as log event
      addLogEntry(entry);

      // Reload the list of queries
      services.getSearchQueriesByTask(getActiveWorker(), activeTask._id);
    }
  }
}

/**
 * Save an active tab.
 */
function saveTab(tab) {
  if (tab != null && utils.isUrl(tab.url) && !utils.isTabAlreadyStored(tab.url, /*taskTabs*/ss.storage.tabs)) {
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