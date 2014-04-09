const data = require("sdk/self").data;
const {Cc, Ci} = require("chrome");
const contextMenu = require("sdk/context-menu");
const pageMod = require("sdk/page-mod");
const services = require("./services");
const tabs = require('sdk/tabs');
const notifications = require("sdk/notifications");
const hotkey = require("sdk/hotkeys").Hotkey;

var sidebar = null;
var workers = [];
var selectedTask = null;

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
          contentScript: 'document.body.style.border = "5px solid red";'
        });
      });
    }
  });
};

//function checkPageInLinks(url) {
//  notify("This page is already in your link list.");
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
    label: "Store selection as note in current task",
    context: contextMenu.SelectionContext(),
    contentScript: 'self.on("click", function () {' +
                   '  self.postMessage(window.getSelection().toString());' + 
                   '});',
    onMessage: function (selectionText) {
      var json = { 
        "body" : selectionText
      };

      // Add note via service layer
      services.addNote(getActiveWorker(), JSON.stringify(json), selectedTask.idAsString);
    }
  });

  /**
   * Context menu: Store A HREF as link to current task.
   */
  var linkItem = contextMenu.Item({
    label: "Add link to current task",
    context: contextMenu.SelectorContext('a[href]'),
    contentScript:  'self.on("click", function (node, data) {' +
                    '  self.postMessage(node.href);' +
                    '});' +
                    'self.on("context", function () {' + 
                    '  if (selectedTask != null) return true;' +
                    '});',
    onMessage: function (selectionText) {
      var json = { 
        "url" : selectionText,
        "title" : selectionText, 
        "description" : ""
      };

      // Add link via service layer
      services.addLink(getActiveWorker(), JSON.stringify(json), selectedTask.idAsString);
    }
  });

  /**
   * Context menu: Store current page as link to current task.
   */
  var pageItem = contextMenu.Item({
    label: "Add this page to current task",
    context: contextMenu.PageContext(),
    contentScript:  'self.on("click", function () {' +
                    '  self.postMessage();' +
                    '});' +
                    'self.on("context", function () {' + 
                    '  if (selectedTask == null) { return false } else { return true };' +
                    '});',
    onMessage: function () {
      var tab = tabs.activeTab;
      var json = { 
        "url" : tab.url,
        "title" : tab.title, 
        "description" : ""
      };

      // Add link via service layer
      services.addLink(getActiveWorker(), JSON.stringify(json), selectedTask.idAsString);
    }
  });
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
  sidebar = require("sdk/ui/sidebar").Sidebar({
    id: 'taskstodo-sidebar',
    title: 'TasksTodo.org',
    url: data.url("index.html"),

    onAttach: function (worker) {
      // Add sidebar worker to the workers array
      workers.push(worker);
      worker.on("detach", function() {
        var index = workers.indexOf(worker);
        if (index >= 0) workers.splice(index, 1);
      });

      /**
       * Loads all tasks.
       */
      worker.port.on("LoadTasks", function(project) {
        services.loadTasks(worker, project);
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
       * Selects a task.
       */
      worker.port.on("TaskSelected", function(task) {
        selectedTask = task;
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
        services.addNote(worker, note, selectedTask.idAsString);
      });

      worker.port.on("NoteAdded", function(note) {
        notify("Note has been added to your current task");
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
      // TASK: LINKS                                                             //
      /////////////////////////////////////////////////////////////////////////////

      /**
       * Loads all links regarding to the selected task.
       */
      worker.port.on("LoadLinks", function(task) {
        services.loadLinks(worker, task.idAsString);
      });

      /**
       * Adds a new link to the selected task.
       */
      worker.port.on("AddLink", function(link) {
        services.addLink(worker, link, selectedTask.idAsString);
      });

      worker.port.on("LinkAdded", function(link) {
        notify("Link has been added to your current task");
      });   

      /**
       * Saves changes to an existing link.
       */
      worker.port.on("UpdateLink", function(link) {
        services.updateLink(worker, link);
      });

      /**
       * Deletes an existing link.
       */
      worker.port.on("DeleteLink", function(link) {
        services.deleteLink(worker, link);
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


// Create a page mod
// It will run a script whenever a ".org" URL is loaded
// The script replaces the page contents with a message
/*pageMod.PageMod({
  include: "*.org",
  contentScript: 'document.body.innerHTML = ' +
                 ' "<h1>Damn, this rulez</h1>";'
});*/
/*
var panel = require("sdk/panel").Panel({
  width: 400,
  position: {
    top: 0,
    bottom: 0,
    left: 0
  },
  contentURL: data.url("index.html")
});

function togglePanel() {
  panel.show();
}*/

/////////////////////////////////////////////////////////////////////////////
// TASKS                                                                   //
/////////////////////////////////////////////////////////////////////////////

// /**
//  * Loads all tasks.
//  */
// panel.port.on("LoadTasks", function(project) {
//   services.loadTasks(panel, project);
// });

// /**
//  * Adds a new task to the project.
//  */
// panel.port.on("AddTask", function(data) {
//   panel.port.emit("TaskAdded", note);
// });

// /**
//  * Saves changes to an existing task.
//  */
// panel.port.on("SaveTask", function(data) {
//   panel.port.emit("TaskSaved");
// });

// /**
//  * Deletes an existing task.
//  */
// panel.port.on("DeleteTask", function(data) {
//   panel.port.emit("TaskDeleted");
// });

// /**
//  * Selects a task.
//  */
// panel.port.on("TaskSelected", function(task) {
//   selectedTask = task;
//   console.log("Selected task: " + selectedTask.idAsString);
// });

// /////////////////////////////////////////////////////////////////////////////
// // TASK: NOTES                                                             //
// /////////////////////////////////////////////////////////////////////////////

// /**
//  * Loads all notes regarding to the selected task.
//  */
// panel.port.on("LoadNotes", function(task) {
//   services.loadNotes(panel, task.idAsString);
// });

// /**
//  * Adds a new note to the selected task.
//  */
// panel.port.on("AddNote", function(note) {
//   services.addNote(panel, note, selectedTask.idAsString);
// });

// /**
//  * Saves changes to an existing note.
//  */
// panel.port.on("UpdateNote", function(note) {
//   services.updateNote(panel, note);
// });

// /**
//  * Deletes an existing note.
//  */
// panel.port.on("DeleteNote", function(note) {
//   services.deleteNote(panel, note);
// });

// /////////////////////////////////////////////////////////////////////////////
// // TASK: LINKS                                                             //
// /////////////////////////////////////////////////////////////////////////////

// /**
//  * Loads all links regarding to the selected task.
//  */
// panel.port.on("LoadLinks", function(task) {
//   services.loadLinks(panel, task.idAsString);
// });

// /**
//  * Adds a new link to the selected task.
//  */
// panel.port.on("AddLink", function(link) {
//   services.addLink(panel, link, selectedTask.idAsString);
// });

// /**
//  * Saves changes to an existing link.
//  */
// panel.port.on("UpdateLink", function(link) {
//   services.updateLink(panel, link);
// });

// /**
//  * Deletes an existing link.
//  */
// panel.port.on("DeleteLink", function(link) {
//   services.deleteNote(panel, link);
// });



