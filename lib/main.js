var self = require("sdk/self");
var {Cc, Ci} = require("chrome");
var contextMenu = require("sdk/context-menu");
var pageMod = require("sdk/page-mod");
var services = require("./services");

/*
var widgets = require("sdk/widget");
var tabs = require("sdk/tabs");
 
var widget = widgets.Widget({
  id: "mozilla-link",
  label: "Mozilla website",
  contentURL: "http://www.mozilla.org/favicon.ico",
  onClick: function() {
    worker = tabs.activeTab.attach({
      contentScriptFile: self.data.url("my-script.js")
    });
    worker.port.emit("drawBorder", "red");
  }
});
*/

var noteItem = null;
var linkItem = null;
var sidebar = null;

var selectedTask = "52950ebe3004676c2b42a108";

/**
 * Constructor, called when add-on gets installed or activated.
 */
exports.main = function(options, callbacks) {
	addToolbarButton();
  setContextMenuItems();
  createSideBar();
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
  btn.setAttribute('image', self.data.url('img/icon16.png')); // path is relative to data folder
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
  noteItem = contextMenu.Item({
    label: "Store selection as note in current task",
    context: contextMenu.SelectionContext(),
    contentScript: 'self.on("click", function () {' +
                   '  self.postMessage(window.getSelection().toString());' +
                   '});',
    onMessage: function (selectionText) {
      var json = { 
        "body" : selectionText
      };
      panel.port.emit("AddNote", JSON.stringify(json));
    }
  });

  /**
   * Context menu: Store A HREF as link to current task.
   */
  linkItem = contextMenu.Item({
    label: "Add link to current task",
    context: contextMenu.SelectorContext('a[href]'),
    contentScript: 'self.on("click", function (node, data) {' +
                   '  self.postMessage(node.href);' +
                   '});',
    onMessage: function (selectionText) {
      var json = { 
        "url" : selectionText,
        "title" : selectionText, 
        "description" : ""
      };
      panel.port.emit("AddLink", JSON.stringify(json));
    }
  });
}

/**
 * This function creates the sidebar.
 */
function createSideBar() {
  sidebar = require("sdk/ui/sidebar").Sidebar({
    id: 'taskstodo-sidebar',
    title: 'TasksTodo.org',
    url: self.data.url("index.html"),

    onAttach: function (worker) {
      /**
       * Loads all tasks.
       */
      worker.port.on("LoadTasks", function(project) {
        services.loadTasks(worker, project);
      });

      /**
       * Adds a new task to the project.
       */
      worker.port.on("AddTask", function(data) {
        //panel.port.emit("TaskAdded", note);
      });

      /**
       * Saves changes to an existing task.
       */
      worker.port.on("SaveTask", function(data) {
        //panel.port.emit("TaskSaved");
      });

      /**
       * Deletes an existing task.
       */
      worker.port.on("DeleteTask", function(data) {
        //panel.port.emit("TaskDeleted");
      });

      /**
       * Selects a task.
       */
      worker.port.on("TaskSelected", function(task) {
        selectedTask = task;
//        console.log("Selected task: " + selectedTask.idAsString);
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
        services.deleteNote(worker, link);
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

  sidebar.addPanel();
}

/**
 * This function opens the sidebar and loads the Tasks Todo website.
 */
function toggleSideBar() {
  sidebar.show();
}

// Create a page mod
// It will run a script whenever a ".org" URL is loaded
// The script replaces the page contents with a message
/*pageMod.PageMod({
  include: "*.org",
  contentScript: 'document.body.innerHTML = ' +
                 ' "<h1>Damn, this rulez</h1>";'
});*/

var panel = require("sdk/panel").Panel({
  width: 400,
  position: {
    top: 0,
    bottom: 0,
    left: 0
  },
  contentURL: self.data.url("index.html")
});

function togglePanel() {
  panel.show();
}

/////////////////////////////////////////////////////////////////////////////
// TASKS                                                                   //
/////////////////////////////////////////////////////////////////////////////

var selectedTask = null;

/**
 * Loads all tasks.
 */
panel.port.on("LoadTasks", function(project) {
  services.loadTasks(panel, project);
});

/**
 * Adds a new task to the project.
 */
panel.port.on("AddTask", function(data) {
  panel.port.emit("TaskAdded", note);
});

/**
 * Saves changes to an existing task.
 */
panel.port.on("SaveTask", function(data) {
  panel.port.emit("TaskSaved");
});

/**
 * Deletes an existing task.
 */
panel.port.on("DeleteTask", function(data) {
  panel.port.emit("TaskDeleted");
});

/**
 * Selects a task.
 */
panel.port.on("TaskSelected", function(task) {
  selectedTask = task;
  console.log("Selected task: " + selectedTask.idAsString);
});

/////////////////////////////////////////////////////////////////////////////
// TASK: NOTES                                                             //
/////////////////////////////////////////////////////////////////////////////

/**
 * Loads all notes regarding to the selected task.
 */
panel.port.on("LoadNotes", function(task) {
  services.loadNotes(panel, task.idAsString);
});

/**
 * Adds a new note to the selected task.
 */
panel.port.on("AddNote", function(note) {
  services.addNote(panel, note, selectedTask.idAsString);
});

/**
 * Saves changes to an existing note.
 */
panel.port.on("UpdateNote", function(note) {
  services.updateNote(panel, note);
});

/**
 * Deletes an existing note.
 */
panel.port.on("DeleteNote", function(note) {
  services.deleteNote(panel, note);
});

/////////////////////////////////////////////////////////////////////////////
// TASK: LINKS                                                             //
/////////////////////////////////////////////////////////////////////////////

/**
 * Loads all links regarding to the selected task.
 */
panel.port.on("LoadLinks", function(task) {
  services.loadLinks(panel, task.idAsString);
});

/**
 * Adds a new link to the selected task.
 */
panel.port.on("AddLink", function(link) {
  services.addLink(panel, link, selectedTask.idAsString);
});

/**
 * Saves changes to an existing link.
 */
panel.port.on("UpdateLink", function(link) {
  services.updateLink(panel, link);
});

/**
 * Deletes an existing link.
 */
panel.port.on("DeleteLink", function(link) {
  services.deleteNote(panel, link);
});



