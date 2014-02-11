$(document).ready(function() {
  
  var hostname = "http://localhost:8080";

  ko.punches.enableAll();
  
  // Initially load all tasks
  loadTasks("inbox");
  
  $(function() {
    $('#nestable-task-list').nestable({ 
      callback: function(l,e) {
        // l is the main container
        // e is the element that was moved
        console.log($(e).attr("id"));
        console.log(e);
      }
    });
  });

  /**
   * View model.
   */
  function TaskModel() {
    var self = this;
    
    self.selectedTask = ko.observable();
    self.tasks = ko.observableArray();
    
    self.selectTask = function(data) {
      self.selectedTask(data);
      selectTask(data);
    };
    
//    self.unselectTask = function() {
//      self.selectedTask = ko.observable();
//    };
    
    self.newTask = function(data) {
      $('#new-task-button').toggle();
      $('#new-task-form').fadeToggle("fast");
    };
    
    self.cancelNewTask = function(data) {
      $('#new-task-button').toggle();
      $('#new-task-form').toggle();
      $('#new-task-form input').val(null);
    };
    
    self.addTask = function(data) {
      addTask(data);
//      $('#new-note-button').toggle();
//      $('#new-note-form').toggle();
    };
    
    self.editTask = function(data) {
//      $('#new-note-button').toggle();
//      $('#new-note-form').toggle();
      $('#details .inline-view').toggle();
      $('#details .inline-edit').toggle();
    };

    self.cancelEditTask = function(data) {
      $('#details .inline-view').toggle();
      $('#details .inline-edit').toggle();
    };
    
    self.saveTask = function() {
      saveTask(self.selectedTask());
    };
    
    self.deleteTask = function() {
      deleteTask(self.selectedTask());
    };
    
    // --
    
    self.notes = ko.observableArray();
    
    self.newNote = function(data) {
      $('#new-note-button').toggle();
      $('#new-note-form').fadeToggle("fast");
    };
    
    self.cancelNewNote = function(data) {
      $('#new-note-button').toggle();
      $('#new-note-form').toggle();
      $('#new-note-form textarea').val(null);
    };
    
    self.addNote = function(form) {
      var json = { 
        "body" : $("#input-new-note-body").val()
      };
      addNote(JSON.stringify(json));
      $('#new-note-button').toggle();
      $('#new-note-form').toggle();
    };
    
    self.editNote = function(data) {
      $('#new-note-button').toggle();
      $('#new-note-form').toggle();
      $('#'+data.idAsString+' .inline-view').toggle();
      $('#'+data.idAsString+' .inline-edit').toggle();
    };

    self.cancelEditNote = function(data) {
      $('#'+data.idAsString+' .inline-view').toggle();
      $('#'+data.idAsString+' .inline-edit').toggle();
    };
    
    self.updateNote = function(data) {
      var json = { 
        "body" : data.body
      };
      updateNote(JSON.stringify(json));
    };
    
    self.deleteNote = function(data) {
      deleteNote(data);
    };
    
    // --
    
    self.links = ko.observableArray();
    
    self.newLink = function(data) {
      $('#new-link-button').toggle();
      $('#new-link-form').fadeToggle("fast");
    };
    
    self.cancelNewLink = function(data) {
      $('#new-link-button').toggle();
      $('#new-link-form').toggle();
      $('#new-link-form input').val(null);
      $('#new-link-form textarea').val(null);
    };
    
    self.addLink = function(form) {
      var json = { 
        "url" : $('#input-new-link-url').val(),
        "title" : $('#input-new-link-title').val(), 
        "description" : $('#input-new-link-description').val()
      };
      console.log(">> " + JSON.stringify(json));
      addLink(JSON.stringify(json));
      $('#new-link-button').toggle();
      $('#new-link-form').toggle();
    };
    
    self.editLink = function(data) {
      $('#new-link-button').toggle();
      $('#new-link-form').toggle();
      $('#'+data.idAsString+' .inline-view').toggle();
      $('#'+data.idAsString+' .inline-edit').toggle();
    };

    self.cancelEditLink = function(data) {
      $('#'+data.idAsString+' .inline-view').toggle();
      $('#'+data.idAsString+' .inline-edit').toggle();
    };
    
    self.updateLink = function(data) {
      var json = { 
        "url" : data.url,
        "title" : data.title, 
        "description" : data.description
      };
      updateLink(JSON.stringify(json));
    };
    
    self.deleteLink = function(data) {
      deleteLink(data);
    };
    
    // --
    
    self.files = ko.observableArray();
    
//    self.newFile = function(data) {
//      $('#new-file-button').toggle();
//      $('#new-file-form').fadeToggle("fast");
//    };
//    
//    self.cancelNewFile = function(data) {
//      $('#new-file-button').toggle();
//      $('#new-file-form').toggle();
//      $('#new-file-form input').val(null);
//      $('#new-file-form textarea').val(null);
//    };
//    
    self.addFile = function(data) {
      addFile();
    };
//    
//    self.editFile = function(data) {
//      $('#new-file-button').toggle();
//      $('#new-file-form').toggle();
//      $('#'+data.idAsString+' .inline-view').toggle();
//      $('#'+data.idAsString+' .inline-edit').toggle();
//    };
//
//    self.cancelEditFile = function(data) {
//      $('#'+data.idAsString+' .inline-view').toggle();
//      $('#'+data.idAsString+' .inline-edit').toggle();
//    };
//    
//    self.saveFile = function(data) {
//      saveFile(data);
//    };
    
    self.deleteFile = function(data) {
      deleteFile(data);
    };
  };
  
  // Apply view model
  var taskModel = new TaskModel();
  ko.applyBindings(taskModel, document.getElementById("tasks"));
  
  /////////////////////////////////////////////////////////////////////////////
  // TASKS                                                                   //
  /////////////////////////////////////////////////////////////////////////////
  
  /**
   * Loads all tasks.
   */
  function loadTasks(project) {
    addon.port.emit("LoadTasks", project);
  }

  addon.port.on("TasksLoaded", function(data) {
    ko.utils.arrayForEach(data, function(item) {
      taskModel.tasks.push(item);
    });
  });
  
  /**
   * Adds a new task to the project.
   */
  function addTask(task) {
    addon.port.emit("AddTask", task);
  }

  addon.port.on("TaskAdded", function(data) {
    console.log("Task added");
  });
  
  /**
   * Saves changes to an existing task.
   */
  function saveTask(task) {
    addon.port.emit("SaveTask", task);
  }

  addon.port.on("TaskSaved", function(data) {
    console.log("Task saved");
  });
  
  /**
   * Deletes an existing task.
   */
  function deleteTask(task) {
    addon.port.emit("DeleteTask", task);
  }

  addon.port.on("TaskDeleted", function(data) {
    console.log("Task deleted");
  });

  /**
   * Selects a task.
   */
  function selectTask(task) {
    // load all notes of selected task
    loadNotes(task);
    
    // load all links of selected task
    loadLinks(task);
    
    // load all file of selected task
    //loadFiles(task);

    // trigger task selection to addon script      
    addon.port.emit("TaskSelected", task);
  }
  
  /////////////////////////////////////////////////////////////////////////////
  // TASK: NOTES                                                             //
  /////////////////////////////////////////////////////////////////////////////
  
  /**
   * Loads all notes regarding to the selected task.
   */
  function loadNotes(task) {
    addon.port.emit("LoadNotes", task);
  }

  addon.port.on("NotesLoaded", function(data) {
    taskModel.notes.removeAll();
    
    ko.utils.arrayForEach(data, function(item){
      taskModel.notes.push(item);
    });
  });
  
  /**
   * Adds a new note to the selected task.
   */
  function addNote(json) {
    addon.port.emit("AddNote", json);
  }

  addon.port.on("NoteAdded", function(data) {
    taskModel.notes.unshift(data);
  });
  
  /**
   * Saves changes to an existing note.
   */
  function updateNote(json) {
    addon.port.emit("UpdateNote", json);
  }

  addon.port.on("NoteUpdated", function(data) {
    loadNotes(taskModel.selectedTask);
  });
  
  /**
   * Deletes an existing note.
   */
  function deleteNote(note) {
    addon.port.emit("DeleteNote", note);
  }

  addon.port.on("NoteDeleted", function(data) {
    loadNotes(taskModel.selectedTask);
  });
  
  /////////////////////////////////////////////////////////////////////////////
  // TASK: LINKS                                                             //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Loads all links regarding to the selected task.
   */
  function loadLinks(task) {
    addon.port.emit("LoadLinks", task);
  }

  addon.port.on("LinksLoaded", function(data) {
    taskModel.links.removeAll();
    
    ko.utils.arrayForEach(data, function(item){
      taskModel.links.push(item);
    });
  });
  
  /**
   * Adds a new link to the selected task.
   */
  function addLink(json) {
    addon.port.emit("AddLink", json);
  }

  addon.port.on("LinkAdded", function(data) {
    taskModel.links.unshift(data);
  });
  
  /**
   * Saves changes to an existing link.
   */
  function updateLink(json) {
    addon.port.emit("UpdateLink", json);
  }

  addon.port.on("LinkUpdated", function(data) {
    loadLinks(taskModel.selectedTask);
  });
  
  /**
   * Deletes an existing link.
   */
  function deleteLink(link) {
    addon.port.emit("DeleteLink", link);
  }

  addon.port.on("LinkDeleted", function(data) {
    loadLinks(taskModel.selectedTask);
  });
  
  /////////////////////////////////////////////////////////////////////////////
  // TASK: FILES                                                             //
  /////////////////////////////////////////////////////////////////////////////
   

  /////////////////////////////////////////////////////////////////////////////
  // FILTERS                                                                 //
  /////////////////////////////////////////////////////////////////////////////
  
  ko.filters.smartdate = function(date) {
    return moment(date).format("YYYY-MM-DD HH:mm");
  };
});
