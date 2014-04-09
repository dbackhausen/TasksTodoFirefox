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
      var json = { 
        "title" : $("#input-new-task-title").val()
      };
      addTask(JSON.stringify(json));
      $('#new-task-button').toggle();
      $('#new-task-form').toggle();
      $('#new-task-form input').val(null);
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
    
    self.updateTask = function() {
      updateTask(self.selectedTask());
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
      $('#new-note-form textarea').val(null);
    };
    
    self.editNote = function(data) {
      $('#'+data.idAsString+' .inline-view').toggle();
      $('#'+data.idAsString+' .inline-edit').toggle();
    };

    self.cancelEditNote = function(data) {
      $('#'+data.idAsString+' .inline-view').toggle();
      $('#'+data.idAsString+' .inline-edit').toggle();
      $('#input-update-note-body').val(null);
    };
    
    self.updateNote = function(data) {
      updateNote(data);
      $('#'+data.idAsString+' .inline-view').toggle();
      $('#'+data.idAsString+' .inline-edit').toggle();
      $('#input-update-note-body').val(null);
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
      addLink(JSON.stringify(json));
      $('#new-link-button').toggle();
      $('#new-link-form').toggle();
    };
    
    self.editLink = function(data) {
      $('#'+data.idAsString+' .inline-view').toggle();
      $('#'+data.idAsString+' .inline-edit').toggle();
    };

    self.cancelEditLink = function(data) {
      $('#'+data.idAsString+' .inline-view').toggle();
      $('#'+data.idAsString+' .inline-edit').toggle();
      $('#new-link-form input').val(null);
      $('#new-link-form textarea').val(null);
    };
    
    self.updateLink = function(data) {
      updateLink(data);
      $('#'+data.idAsString+' .inline-view').toggle();
      $('#'+data.idAsString+' .inline-edit').toggle();
      $('#new-link-form input').val(null);
      $('#new-link-form textarea').val(null);
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

  addon.port.on("TasksLoaded", function(tasks) {
    taskModel.tasks.removeAll();
    ko.utils.arrayForEach(tasks, function(task) {
      taskModel.tasks.push(task);
    });
  });
  
  /**
   * Adds a new task to the project.
   */
  function addTask(task) {
    addon.port.emit("AddTask", task);
  }

  addon.port.on("TaskAdded", function(data) {
    // load all tasks of selected project
    loadTasks("inbox");
  });
  
  /**
   * Saves changes to an existing task.
   */
  function updateTask(task) {
    addon.port.emit("UpdateTask", task);
  }

  addon.port.on("TaskUpdated", function(data) {
    console.log("Task updated");
    // load all tasks of selected project
    loadTasks("inbox");
  });
  
  /**
   * Deletes an existing task.
   */
  function deleteTask(task) {
    addon.port.emit("DeleteTask", task);
  }

  addon.port.on("TaskDeleted", function(data) {
    console.log("Task deleted");
    // load all tasks of selected project
    loadTasks("inbox");
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

  addon.port.on("ReloadNotes", function() {
    console.log("Reloading notes");
  });

  addon.port.on("NotesLoaded", function(notes) {
    taskModel.notes.removeAll();
    
    ko.utils.arrayForEach(notes, function(note){
      taskModel.notes.push(note);
    });
  });
  
  /**
   * Adds a new note to the selected task.
   */
  function addNote(note) {
    addon.port.emit("AddNote", note);
  }

  addon.port.on("NoteAdded", function(note) {
    taskModel.notes.unshift(note);
  });
  
  /**
   * Saves changes to an existing note.
   */
  function updateNote(note) {
    addon.port.emit("UpdateNote", note);
  }

  addon.port.on("NoteUpdated", function(note) {
    // reload all notes
    loadNotes(taskModel.selectedTask());
  });
  
  /**
   * Deletes an existing note.
   */
  function deleteNote(note) {
    addon.port.emit("DeleteNote", note);
  }

  addon.port.on("NoteDeleted", function(note) {
    console.log("Note deleted");
    // reload all notes
    loadNotes(taskModel.selectedTask());
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
  function updateLink(link) {
    addon.port.emit("UpdateLink", link);
  }

  addon.port.on("LinkUpdated", function(data) {
    // reload all links
    loadLinks(taskModel.selectedTask());
  });
  
  /**
   * Deletes an existing link.
   */
  function deleteLink(link) {
    addon.port.emit("DeleteLink", link);
  }

  addon.port.on("LinkDeleted", function(data) {
    // reload all links
    loadLinks(taskModel.selectedTask());
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
