$(document).ready(function() {
  
  ko.punches.enableAll();

  var activeUser;
  var activeGoal;

  // Get active user
  addon.port.emit("GetActiveUser");

  /**
   * Callback method, when active user is loaded.
   */
  addon.port.on("ActiveUserLoaded", function(user) {
    if (user != null) {
      // Set active user
      activeUser = user;

      // Load all user goals
      addon.port.emit("LoadGoals", activeUser);

      // Get the active goal
      addon.port.emit("GetActiveGoal");
    }
  });
  
  /****************************************************************************
   * TASK MODEL
   ****************************************************************************/
  function TaskModel() {
    var self = this;
    
    self.selectedGoal = ko.observable();
    self.selectedTask = ko.observable();
    self.tasks = ko.observableArray();

    self.selectTask = function(task) { 
      self.selectedTask = task;

      $("#task-form-input-title").val(self.selectedTask.title);
      $("#task-form-input-description").val(self.selectedTask.description);

      // if (self.selectedTask.dueDate != null) {
      //   $("#task-form-input-due_date").val(
      //     moment(new Date(self.selectedTask.dueDate)).format("YYYY-MM-DD"));        
      // } else {
      //   $("#task-form-input-due_date").val(null);
      // }
  
      // if (self.selectedTask.reminderDate != null) {
      //   $("#task-form-input-reminder_date").val(
      //     moment(new Date(self.selectedTask.reminderDate)).format("YYYY-MM-DD"));
      // } else {
      //   $("#task-form-input-reminder_date").val(null);
      // }

      selectTask(self.selectedTask);
    };
    
    self.newTask = function() {
      self.selectedTask = ko.observable();
      $("#task-form-input-title").val(null);
      $("#task-form-input-description").val(null);
      // $("#task-form-input-due_date").val(null);
      // $("#task-form-input-reminder_date").val(null);
      $("#task-form").show("fast");
    };
    
    self.editTask = function(task) {
      $("#task-form").show("fast");
    };

    self.cancelTaskForm = function() {
      self.selectedTask = ko.observable();
      $("#task-form").hide();
      $("#task-form-input-title").val(null);
      $("#task-form-input-description").val(null);
      // $("#task-form-input-due_date").val(null);
      // $("#task-form-input-reminder_date").val(null);
    };

    self.saveTask = function() {
      var title = $("#task-form-input-title").val();
      var description = $("#task-form-input-description").val();
      var dueDate = $("#task-form-input-due_date").val();
      var reminderDate = $("#task-form-input-reminder_date").val();
 
      if (title != null && title.length > 0) {
        if (self.selectedTask != null && self.selectedTask.id != null) {
          // Update task
          var json = { 
            "id" : self.selectedTask.idAsString,
            "goalId" : activeGoal.idAsString,
            "title" : title,
            "description" : description,
            "dueDate" : dueDate,
            "reminderDate" : reminderDate
          };

          updateTask(json);
        } else {
          // Add new task
          var json = { 
            "goalId" : activeGoal.idAsString,
            "title" : title,
            "description" : description,
            "dueDate" : dueDate,
            "reminderDate" : reminderDate
          };

          addTask(json);
        }

        self.cancelTaskForm();
      }
    }

    self.deleteTask = function(task) {
      deleteTask(task);
    };

    self.finishTask = function(task) {
      alert("Task finished!");
    };

    self.indentTask = function(task) {
      if ($('#'+task.idAsString).prev('li').length > 0) {
        var parentId = $('#'+task.idAsString).prev('li').attr('id');
        console.log("Indent " + task.idAsString + " to " + parentId);

          var json = { 
            "id" : self.selectedTask.idAsString,
            "goalId" : activeGoal.idAsString,
            "parentId" : parentId,
            "title" : self.selectedTask.title,
            "description" : self.selectedTask.description,
            "dueDate" : self.selectedTask.dueDate,
            "reminderDate" : self.selectedTask.reminderDate
          };

          updateTask(json);
      }
    };

    self.outdentTask = function(task) {
      alert("Outdent task!");
    };
    
    // -- NOTES
    
    self.notes = ko.observableArray();
    
    self.newNote = function() {
      $('#edit-note-form-input-body').val(null);
      $('.task-note-list').find(".inline-edit:visible").hide();
      $('#new-note-form-button-new').toggle();
      $('.task-note-list-empty').toggle();
      $('#new-note-form').fadeToggle("fast");
    };
    
    self.cancelNewNote = function() {
      $('#new-note-form-button-new').toggle();
      $('.task-note-list-empty').toggle();
      $('#new-note-form').toggle();
      $('#new-note-form-input-body').val(null);
    };
    
    self.addNote = function() {
      var json = { 
        "taskId" : self.selectedTask.idAsString,
        "body" : $('#new-note-form-input-body').val()
      };
      addNote(json);
      self.cancelNewNote();
    };
    
    self.editNote = function(note) {
      $('#new-note-form-button-new').show();
      $('#new-note-form:visible').hide();
      $('.task-note-list').find('.inline-edit:visible').hide();
      $('#'+note.idAsString+' .task-note-list-content').hide();
      $('#'+note.idAsString+' .inline-edit').fadeIn('fast');
      $('#new-note-form-input-body').val(note.body);
    };

    self.cancelEditNote = function(note) {
      $('#'+note.idAsString+' .task-note-list-content').fadeIn('fast');
      $('#'+note.idAsString+' .inline-edit').hide();
    };
    
    self.updateNote = function(note) {
      var json = { 
        "id" : note.idAsString,
        "taskId" : self.selectedTask.idAsString,
        "body" : note.body
      };
      updateNote(json);
      self.cancelEditNote();
    };
    
    self.deleteNote = function(note) {
      deleteNote(note);
    };
    
    // -- BOOKMARKS
    
    self.bookmarks = ko.observableArray();
    
    self.newBookmark = function() {
      $('#edit-bookmark-form-input-body').val(null);
      $('.task-bookmarks-list').find(".inline-edit:visible").hide();
      $('#new-bookmark-form-button-new').toggle();
      $('.task-bookmarks-list-empty').toggle();
      $('#new-bookmark-form').fadeToggle("fast");
    };
    
    self.cancelNewBookmark = function() {
      $('#new-bookmark-form-button-new').toggle();
      $('.task-bookmarks-list-empty').toggle();
      $('#new-bookmark-form').toggle();
      $('#new-bookmark-form-input-body').val(null);
    };
    
    self.addBookmark = function() {
      var json = { 
        "taskId" : self.selectedTask.idAsString,
        "url" : $('#new-bookmark-form-input-url').val(),
        "title" : $('#new-bookmark-form-input-title').val(), 
        "description" : $('#new-bookmark-form-input-description').val()
      };
      addBookmark(json);
      self.cancelNewBookmark();
    };
    
    self.editBookmark = function(bookmark) {
      $('#'+bookmark.idAsString+' .task-bookmarks-list-content').toggle();
      $('#'+bookmark.idAsString+' .inline-edit').fadeToggle("fast");
    };

    self.cancelEditBookmark = function(bookmark) {
      $('#'+bookmark.idAsString+' .task-bookmarks-list-content').fadeToggle("fast");
      $('#'+bookmark.idAsString+' .inline-edit').toggle();
      $('#new-bookmark-form-input-url').val(null);
      $('#new-bookmark-form-input-title').val(null);
      $('#new-bookmark-form-input-description').val(null);    
    };
    
    self.updateBookmark = function(bookmark) {
      var json = {
        "id" : bookmark.idAsString,
        "taskId" : self.selectedTask().idAsString,
        "url" : bookmark.url,
        "title" : bookmark.title, 
        "description" : bookmark.description
      };
      updateBookmark(json);
      self.cancelEditBookmark(bookmark);
    };
    
    self.deleteBookmark = function(bookmark) {
      deleteBookmark(bookmark);
    };

    // -- TABS
    
    self.tabs = ko.observableArray();
    
    self.deleteTab = function(tab) {
      deleteTab(tab);
    };

    // -- HISTORY
    
    self.histories = ko.observableArray();
    
    self.deleteHistory = function(history) {
      deleteHistory(history);
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
  ko.applyBindings(taskModel, document.getElementById("content"));
  
  /////////////////////////////////////////////////////////////////////////////
  // GOAL                                                                    //
  /////////////////////////////////////////////////////////////////////////////
  
  /**
   * Selects a goal.
   */
  function selectGoal(goal) {
    if (activeGoal == null || (goal != null && goal.idAsString != activeGoal.idAsString)) {
      // Trigger goal selection to addon script 
      addon.port.emit("SetActiveGoal", goal);
      addon.port.emit("GetActiveGoal");
    }
  }

  /**
   * Callback method, when goals are loaded.
   */
  addon.port.on("GoalsLoaded", function(goals) {
    console.log("Goals loaded");

    // Add all goals for selection option
//    goalModel.goals.removeAll();
//    ko.utils.arrayForEach(goals, function(goal) {
//      goalModel.goals.push(goal);
//    });
  });

  /**
   * Callback method, when active goal is loaded.
   */
  addon.port.on("ActiveGoalLoaded", function(goal) {
    if (goal != null) {
      console.log("Active goal is " + goal.title);

      // Set active goal
      activeGoal = goal;

      // Set active goal for page binding
      taskModel.selectedGoal(goal);

      // Load all goal tasks
      loadTasks(goal);
    }
  });

  /////////////////////////////////////////////////////////////////////////////
  // TASKS                                                                   //
  /////////////////////////////////////////////////////////////////////////////
  
  /**
   * Loads all tasks.
   */
  function loadTasks(goal) {
    console.log("Loading tasks for goal " + goal.title);
    addon.port.emit("LoadTasks", goal);
  }

  addon.port.on("TasksLoaded", function(tasks) { 
    console.log(JSON.stringify(tasks));
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

  addon.port.on("TaskAdded", function(task) {
    // load all tasks of selected project
    loadTasks(activeGoal);
  });
  
  /**
   * Saves changes to an existing task.
   */
  function updateTask(task) {
    addon.port.emit("UpdateTask", task);
  }

  addon.port.on("TaskUpdated", function(task) {
    console.log("Task updated");
    // load all tasks of selected project
    loadTasks(activeGoal);
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
    loadTasks(activeGoal);
  });

  /**
   * Selects a task.
   */
  function selectTask(task) {
    if (task != null) {
      // Get list entry
      $ttListEntry = $("li#" + task.idAsString);

      // Disable all other task selections
      $(".task-list").find(".task-list-entry").removeClass('selected');
      // Select current list entry
      $ttListEntry.find("div").addClass('selected');

      // Hide all visible options, before showing another one   
      $(".task-list").find(".task-list-options:visible").not($ttListEntry.find(".task-list-options")).hide();
      // Show options for selected task
      $ttListEntry.find(".task-list-options").fadeIn();

      // Hide all visible options, before showing another one   
      $(".task-list").find(".task-list-control a:visible").not($ttListEntry.find(".task-list-control a")).hide();
      // Show options for selected task
      $ttListEntry.find(".task-list-control a").show();        


      // load all notes of selected task
      loadNotes(task);
      
      // load all bookmarks of selected task
      loadBookmarks(task);
                     
      // load tabs of selected task
      loadTabs(task);
   
      // load history of selected task
      loadHistories(task);

      // load all file of selected task
      //loadFiles(task);

      // trigger task selection to addon script      
      addon.port.emit("SetActiveTask", task);      
    }
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
    // reload all notes
    loadNotes(taskModel.selectedTask);
  });
  
  /**
   * Saves changes to an existing note.
   */
  function updateNote(note) {
    addon.port.emit("UpdateNote", note);
  }

  addon.port.on("NoteUpdated", function(note) {
    // reload all notes
    loadNotes(taskModel.selectedTask);
  });
  
  /**
   * Deletes an existing note.
   */
  function deleteNote(note) {
    addon.port.emit("DeleteNote", note);
  }

  addon.port.on("NoteDeleted", function(data) {
    // reload all notes
    loadNotes(taskModel.selectedTask);
  });
  
  /////////////////////////////////////////////////////////////////////////////
  // TASK: BOOKMARKS                                                         //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Loads all bookmarks regarding to the selected task.
   */
  function loadBookmarks(task) {
    addon.port.emit("LoadBookmarks", task);
  }

  addon.port.on("BookmarksLoaded", function(bookmarks) {
    taskModel.bookmarks.removeAll();
    
    ko.utils.arrayForEach(bookmarks, function(bookmark){
      taskModel.bookmarks.push(bookmark);
    });
  });
  
  /**
   * Adds a new bookmark to the selected task.
   */
  function addBookmark(bookmark) {
    addon.port.emit("AddBookmark", bookmark);
  }

  addon.port.on("BookmarkAdded", function(bookmark) {
    // reload all bookmarks
    loadBookmarks(taskModel.selectedTask);
  });
  
  /**
   * Saves changes to an existing bookmark.
   */
  function updateBookmark(bookmark) {
    addon.port.emit("UpdateBookmark", bookmark);
  }

  addon.port.on("BookmarkUpdated", function(bookmark) {
    // reload all bookmarks
    loadBookmarks(taskModel.selectedTask);
  });
  
  /**
   * Deletes an existing bookmark.
   */
  function deleteBookmark(bookmark) {
    addon.port.emit("DeleteBookmark", bookmark);
  }

  addon.port.on("BookmarkDeleted", function(data) {
    // reload all bookmarks
    loadBookmarks(taskModel.selectedTask);
  });

  /////////////////////////////////////////////////////////////////////////////
  // TASK: TABS                                                              //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Loads all tabs regarding to the selected task.
   */
  function loadTabs(task) {
    addon.port.emit("LoadTabs", task);
  }

  addon.port.on("TabsLoaded", function(tabs) {
    taskModel.tabs.removeAll();
    
    ko.utils.arrayForEach(tabs, function(tab){
      taskModel.tabs.push(tab);
    });
  });
  
  /**
   * Adds a new tab to the selected task.
   */
  function addTab(tab) {
    addon.port.emit("AddTab", tab);
  }

  addon.port.on("TabAdded", function(tab) {
    // reload all tabs
    loadTabs(taskModel.selectedTask);
  });
  
  /**
   * Saves changes to an existing tab.
   */
  function updateTab(tab) {
    addon.port.emit("UpdateTab", tab);
  }

  addon.port.on("TabUpdated", function(tab) {
    // reload all tabs
    loadTabs(taskModel.selectedTask);
  });
  
  /**
   * Deletes an existing tab.
   */
  function deleteTab(tab) {
    addon.port.emit("DeleteTab", tab);
  }

  addon.port.on("TabDeleted", function(data) {
    // reload all tabs
    loadTabs(taskModel.selectedTask);
  });

  /////////////////////////////////////////////////////////////////////////////
  // TASK: HISTORY                                                           //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Loads all history regarding to the selected task.
   */
  function loadHistories(task) {
    addon.port.emit("LoadHistories", task);
  }

  addon.port.on("HistoriesLoaded", function(histories) {
    taskModel.histories.removeAll();
    
    ko.utils.arrayForEach(histories, function(history){
      taskModel.histories.push(history);
    });
  });
  
  /**
   * Adds a new history to the selected task.
   */
  function addHistory(history) {
    addon.port.emit("AddHistory", history);
  }

  addon.port.on("HistoryAdded", function(history) {
    // reload all histories
    loadHistories(taskModel.selectedTask);
  });
  
  /**
   * Saves changes to an existing history.
   */
  function updateHistory(history) {
    addon.port.emit("UpdateHistory", history);
  }

  addon.port.on("HistoryUpdated", function(history) {
    // reload all histories
    loadHistories(taskModel.selectedTask);
  });
  
  /**
   * Deletes an existing history.
   */
  function deleteHistory(history) {
    addon.port.emit("DeleteHistory", history);
  }

  addon.port.on("HistoryDeleted", function(data) {
    // reload all histories
    loadHistories(taskModel.selectedTask);
  });

  /////////////////////////////////////////////////////////////////////////////
  // TASK: FILES                                                             //
  /////////////////////////////////////////////////////////////////////////////
   
});
