$(document).ready(function() {
  
  $('#top-menu-goals-button').click(function() {
    $('#content').animate({ left: 0 }, 'normal', function() {
      // Redirect to tasks page
      addon.port.emit("Redirect", "goals.html");
    });
  });


  ko.punches.enableAll();

  // Get active user
  addon.port.emit("GetActiveUser");

  /**
   * Callback method, when active user is loaded.
   */
  addon.port.on("ActiveUserLoaded", function(user) {
    if (user != null) {
      // Set active user
      viewModel.user(new User(user));

      // Load all user goals
      addon.port.emit("LoadGoals", user);

      // Get the active goal
      addon.port.emit("GetActiveGoal");
    }
  });

  function ViewModel() {
    var self = this;
    
    self.user = ko.observable();
    self.selectedGoal = ko.observable();
    self.goals = ko.observableArray();
    self.selectedTask = ko.observable();
    self.tasks = ko.observableArray();
    self.completedTasks = ko.observableArray();

    self.selectGoal = function(goal) {
      $('#content').animate({ left: 0 }, 'normal', function() {
        selectGoal(goal);
      });
    };

    self.selectTask = function(task) {     
      if (self.selectedTask.id != task.id) {
        // Set task in model
        self.selectedTask = task;

        // Select the current task and show options
        selectTask(self.selectedTask);

        // Trigger task selection to addon script      
        addon.port.emit("SetActiveTask", ko.toJS(task));

        // Load task bookmarks      
        loadBookmarks(self.selectedTask);

        // Load task history      
        loadHistory(self.selectedTask);

        // Load latest tabs for restoring
        //loadTabs(self.selectedTask);
        //console.log(JSON.stringify(self.tabs));
      } else {
        // Reset selected task
        self.selectedTask = ko.observable();

        // Select the current task and show options
        selectTask(null);

        // Trigger task selection to addon script      
        addon.port.emit("SetActiveTask", null);
      }
    };
    
    self.newTask = function() {
      self.selectedTask = ko.observable();

      $('#new-task-form-button-new').hide();
      $('#new-task-form:visible').hide();

      $('#new-task-form-input-title').val(null);
      $('#new-task-form').show('fast');
      $('#new-task-form-input-title').focus();

      // Reset width and height
      $('#new-task-form-input-title').css({"width":"", "height":"", "top": "", "left" : ""});
    };

    self.cancelNewTask = function() {
      self.selectedTask = ko.observable();

      $('#new-task-form').hide();
      $('#new-task-form-input-title').val(null);

      $('#new-task-form-button-new').show();
    };
    
    self.editTask = function(task) {
      $('#new-task-form-button-new').hide();
      $('#new-task-form:visible').hide();

      $('.task-list-entry').find('.inline-edit:visible').hide();
      $('#'+task.id).find('.task-list-entry').hide();

      $('#'+task.id+' #edit-task-form-input-title').val(task.title());
      $('#'+task.id+' .inline-edit').fadeIn('fast');
      
      $('#edit-task-form-input-title').height($('#edit-task-form-input-title').prop('scrollHeight'));
    };

    self.cancelEditTask = function(task) {
      $('#new-task-form-button-new').show();
      $('#'+task.id).find('.task-list-entry').show();

      $('#'+task.id+' .inline-edit').hide();
      $('#'+task.id+' #edit-task-form-input-title').val(null);
    };

    self.addTask = function() {
      var title = $("#new-task-form-input-title").val();
 
      if (title != null && title.length > 0) {
        addTask(new Task({
          "goalId" : self.selectedGoal().id,
          "title" : title,
          "description" : "",
          "position" : self.tasks().length > 0 ? (self.tasks().length + 1) : 1,
          "level" : 0,
          "dueDate" : null,
          "reminderDate" : null,
          "created" : new Date(),
          "modified" : new Date()
        }));
      }

      self.cancelNewTask();
    }

    self.updateTask = function(task) {
      var title = $('#'+task.id+' #edit-task-form-input-title').val();

      if (task.title() != null && task.title().length > 0) {
        task.title(title);
        updateTask(task);
      } else {
        deleteTask(task);
      }

      self.cancelEditTask(task);
    }

    self.deleteTask = function(task) {
      deleteTask(task);
    };

    self.completeTask = function(task) {
      if (task.completed()) {
        task.completed(false);
        task.completedDate(null);
        updateTask(task);
        self.tasks.push(task);
        self.completedTasks.remove(task);
      } else {
        task.completed(true);
        task.completedDate(new Date());
        updateTask(task);
        self.tasks.remove(task);
        self.completedTasks.push(task);
      }
    };

    self.indentTask = function(task) {
      if (task != null && task.position() > 1) {
        for (var i = task.position() - 2; i >= 0; i--) {  
          if ((task.level() + 1) - self.tasks()[i].level() == 1) {
            task.parentId(self.tasks()[i].id);
            task.level(task.level() + 1);
            console.log("Indent " + task.title() + " to " + task.level() + " with parent " + self.tasks()[i].title());
            updateTask(task);
            break;
          } else {
            return;
          }
        };
      }
    };

    self.outdentTask = function(task) {
      if (task != null && task.level() > 0 && task.position() > 1) {       
        task.level(task.level() - 1);

        if (task.level() == 0) {
          task.parentId(null);
        }

        console.log("Outdent " + task.title() + " to " + task.level());
        updateTask(task);
      }
    };

    self.moveTask = function(arg, event, ui) {
      console.log(arg.item.title() + " dragged from " + arg.sourceIndex + " to " + arg.targetIndex);

      if (arg.sourceIndex != arg.targetIndex) {
        arg.item.position(arg.targetIndex + 1);

        if (arg.item.level() > 0) {
          // If task is a subtask
          if (arg.targetIndex == 0) {
            // If task is moved to the top, the
            // task level has to be set to 0
            arg.item.level(0);
            // and the parent has to be set to 0
            arg.item.parentId(null);
          } else {
            // Set the new parent
            arg.item.parentId(self.tasks()[arg.targetIndex - 1].id);
            arg.item.level(self.tasks()[arg.targetIndex - 1].level() + 1);
          }
        }

        updateTask(arg.item);

        // If task position has been modified
        ko.utils.arrayForEach(self.tasks(), function(task) {
          if (task.id != arg.item.id) {
            if (arg.sourceIndex < arg.targetIndex) {
              // Task has been moved to a lower position
              if (task.position() > (arg.sourceIndex + 1) && task.position() <= (arg.targetIndex + 1)) {
                task.position(task.position() - 1);

                if (task.position == 0 && task.level() > 0) {
                  task.level(0);
                }

                updateTask(task);
                // console.log("Setting " + task.title() + " to position " + task.position());
              }
            } else {
              // Task has been moved to a higher position
              if (task.position() < (arg.sourceIndex + 1) && task.position() >= (arg.targetIndex + 1)) {
                task.position(task.position() + 1);

                if (task.position == 0 && task.level() > 0) {
                  task.level(0);
                }

                updateTask(task);
                // console.log("Setting " + task.title() + " to position " + task.position());
              }
            }

            if (task.position() > 1 && task.level() > 0) {
              for (var i = task.position() - 2; i >= 0; i--) {
                if ((task.level() - self.tasks()[i].level() == 1) && task.parentId() != self.tasks()[i].id) {
                  // if task level is higher than the previous task, 
                  // than set new parent
                  task.parentId(self.tasks()[i].id);
                  updateTask(task);
                  // console.log("Setting parent of " + task.title() + " to " + self.tasks()[i].title());
                  break;
                }
              }
            }
          }
        });

        if (self.selectedTask != null && self.selectedTask.id == arg.item.id) {
          selectTask(arg.item);
        }
      }
    }

    // -- NOTES
    
    self.notes = ko.observableArray();

    self.loadNotes = function() {
      loadNotes(self.selectedTask);
    }

    self.newNote = function() {
      $('.task-note-list').find(".inline-edit:visible").hide();
      $('#new-note-form-button-new').toggle();
      $('.task-note-list-empty').toggle();
      $('#new-note-form').fadeToggle("fast");
      $('#new-note-form-input-body').focus();
      // Reset width and height
      $('#new-note-form-input-body').css({"width":"", "height":"", "top": "", "left" : ""});
    };
    
    self.cancelNewNote = function() {
      $('#new-note-form-button-new').toggle();
      $('.task-note-list-empty').toggle();
      $('#new-note-form').toggle();
      $('#new-note-form-input-body').val(null);
    };
    
    self.addNote = function() {
      var body = $('#new-note-form-input-body').val();

      if (body != null && body.length > 0) {
        addNote(new Note({
          "taskId" : self.selectedTask.id,
          "body" : body,
          "created" : new Date(),
          "modified" : new Date()
        }));        
      }

      self.cancelNewNote();
    };
    
    self.editNote = function(note) {
      $('#new-note-form-button-new').hide();
      $('#new-note-form:visible').hide();
      
      $('#'+note.id+' .task-note-list-content').hide();
      $('.task-note-list').find('.inline-edit:visible').hide();
      $('#'+note.id+' .inline-edit').fadeIn('fast');

      $('#edit-note-form-input-body').val(note.body());
      $('#edit-note-form-input-body').focus();
    };

    self.cancelEditNote = function(note) {
      $('#new-note-form-button-new').show();
      $('#'+note.id+' .task-note-list-content').fadeIn('fast');
      $('#'+note.id+' .inline-edit').hide();
    };
    
    self.updateNote = function(note) {
      if (note.body() != null && note.body().length > 0) {
        note.modified(new Date());
        updateNote(note);
      } else {
        // deleteNote(note);
      }

      self.cancelEditNote(note);
    };
    
    self.deleteNote = function(note) {
      deleteNote(note);
    };   
    
    // -- BOOKMARKS
    
    self.bookmarks = ko.observableArray();
    
    self.loadBookmarks = function() {
      loadBookmarks(self.selectedTask);
    }

    self.newBookmark = function() {
      $('.task-bookmarks-list').find(".inline-edit:visible").hide();
      $('#new-bookmark-form-button-new').toggle();
      $('.task-bookmarks-list-empty').toggle();
      $('#new-bookmark-form').fadeToggle("fast");
      $('#new-bookmark-form-input-title').focus();
    };
    
    self.cancelNewBookmark = function() {
      $('#new-bookmark-form-button-new').toggle();
      $('.task-bookmarks-list-empty').toggle();
      $('#new-bookmark-form').toggle();
      $('#new-bookmark-form-input-title').val(null);
      $('#new-bookmark-form-input-url').val(null);
      $('#new-bookmark-form-input-description').val(null);    
    };
    
    self.addBookmark = function() {
      var title = $('#new-bookmark-form-input-title').val();
      var url = $('#new-bookmark-form-input-url').val();
      var description = $('#new-bookmark-form-input-description').val();

      if (false || title.length > 0 && url.length > 0) {
        addBookmark(new Bookmark({ 
          "taskId" : self.selectedTask.id,
          "title" : title, 
          "url" : url,
          "description" : description,
          "created" : new Date(),
          "modified" : new Date()
        }));
      } else {
        // TODO show error!
      }

      self.cancelNewBookmark();      
    };
    
    self.editBookmark = function(bookmark) {
      $('#new-bookmark-form-button-new').hide();
      $('#new-bookmark-form:visible').hide();
      $('#'+bookmark.id+' .task-bookmarks-list-content').toggle();
      $('#'+bookmark.id+' .inline-edit').fadeToggle("fast");
      $('#edit-bookmark-form-input-title').val(bookmark.title());
      $('#edit-bookmark-form-input-url').val(bookmark.url());
      $('#edit-bookmark-form-input-description').val(bookmark.description());  
      $('#edit-bookmark-form-input-title').focus();
    };

    self.cancelEditBookmark = function(bookmark) {
      $('#new-bookmark-form-button-new').show();
      $('#'+bookmark.id+' .task-bookmarks-list-content').fadeToggle("fast");
      $('#'+bookmark.id+' .inline-edit').toggle();
      $('#edit-bookmark-form-input-title').val(null);
      $('#edit-bookmark-form-input-url').val(null);
      $('#edit-bookmark-form-input-description').val(null);    
    };
    
    self.updateBookmark = function(bookmark) {
      JSON.stringify("Updating bookmark: " + bookmark);
      if (bookmark.title().length > 0 && bookmark.title().url > 0) {
        bookmark.modified(new Date());

        updateBookmark(bookmark);
      } else {
        // TODO show error!
      }

      self.cancelEditBookmark(bookmark);
    };
    
    self.deleteBookmark = function(bookmark) {
      deleteBookmark(bookmark);
    };

    // -- TABS
    
    self.tabs = ko.observableArray();
    
    self.loadTabs = function() {
      loadTabs(self.selectedTask);
    }

    self.deleteTab = function(tab) {
      deleteTab(tab);
    };

    // -- HISTORY
    
    self.history = ko.observableArray();
    
    self.loadHistory = function() {
      loadHistory(self.selectedTask);
    }

    self.deleteHistoryEntry = function(entry) {
      deleteHistoryEntry(entry);
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
//      $('#'+data.id+' .inline-view').toggle();
//      $('#'+data.id+' .inline-edit').toggle();
//    };
//
//    self.cancelEditFile = function(data) {
//      $('#'+data.id+' .inline-view').toggle();
//      $('#'+data.id+' .inline-edit').toggle();
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
  var viewModel = new ViewModel();
  ko.applyBindings(viewModel);
    
  /////////////////////////////////////////////////////////////////////////////
  // GOAL                                                                    //
  /////////////////////////////////////////////////////////////////////////////
  
  /**
   * Callback method, when goals are loaded.
   */
  addon.port.on("GoalsLoaded", function(goals) {
    // Add all goals for selection option
    viewModel.goals.removeAll();
    ko.utils.arrayForEach(goals, function(goal) {
      viewModel.goals.push(new Goal(goal));
    });
  });

  /**
   * Selects a goal.
   */
  function selectGoal(goal) {
    // Set goal selection to addon script      
    addon.port.emit("SetActiveGoal", ko.toJS(goal));

    // Load active goal
    addon.port.emit("GetActiveGoal");
  }

  /**
   * Callback method, when active goal is loaded.
   */
  addon.port.on("ActiveGoalLoaded", function(goal) {
    // Set active goal for page binding
    viewModel.selectedGoal(new Goal(goal));

    // Load all goal tasks
    loadTasks(viewModel.selectedGoal());

    // Load all completed tasks
    loadCompletedTasks(viewModel.selectedGoal());

    // Reset selected task
    viewModel.selectedTask = ko.observable();
  });

  /////////////////////////////////////////////////////////////////////////////
  // TASKS                                                                   //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Loads all tasks.
   */
  function loadTasks(goal) {
    addon.port.emit("LoadTasks", goal);
  }

  addon.port.on("TasksLoaded", function(tasks) { 
    viewModel.tasks.removeAll();
    ko.utils.arrayForEach(tasks, function(task) {
      viewModel.tasks.push(new Task(task));
    });
  });

  /**
   * Loads all completed tasks.
   */
  function loadCompletedTasks(goal) {
    addon.port.emit("LoadCompletedTasks", goal);
  }

  addon.port.on("CompletedTasksLoaded", function(tasks) { 
    viewModel.completedTasks.removeAll();
    ko.utils.arrayForEach(tasks, function(task) {
      viewModel.completedTasks.push(new Task(task));
    });
  });

  /**
   * Adds a new task to the project.
   */
  function addTask(task) {
    addon.port.emit("AddTask", ko.toJSON(task));
  }

  addon.port.on("TaskAdded", function(data) {
    viewModel.tasks.push(new Task(data));
  });
  
  /**
   * Saves changes to an existing task.
   */
  function updateTask(task) {
    task.modified(new Date());
    addon.port.emit("UpdateTask", ko.toJSON(task));
  }

  addon.port.on("TaskUpdated", function(task) {
    console.log("Task '" + task.title + "' has been updated");
  });
  
  /**
   * Deletes an existing task.
   */
  function deleteTask(task) {
    task.deleted(true);
    task.position(-1);
    task.parentId(null);
    task.level(0);
    updateTask(task);
    viewModel.tasks.remove(task);
  }

  addon.port.on("TaskDeleted", function(data) {
    console.log("Task '" + task.title + "' has been marked as deleted");
  });

  /**
   * Selects a task.
   */
  function selectTask(task) {
    // Disable all inline editors
    $('.task-list').find('.inline-edit').hide();
    $('.task-list').find('.task-list-entry').show();

    // Disable all other task selections
    $('.task-list').find('.selected').removeClass('selected');
    // Hide all visible options, before showing another one  
    $('.task-list').find('.task-list-entry-options:visible').not($(ttListEntry).find('.task-list-entry-options')).hide();
    // Hide all visible options, before showing another one   
    $('.task-list').find('.task-list-entry-control a:visible').not($(ttListEntry).find('.task-list-entry-control a')).hide();

    if (task != null) {
      // Make sure the input field value is set
      $("#edit-task-form-input-title").val(task.title());

      // Get list entry
      var ttListEntry = $("li#" + task.id);

      // Select current list entry
      $(ttListEntry).find('div').addClass('selected');

      // Show options for selected task
      $(ttListEntry).find('.task-list-entry-options').fadeIn();

      // Show options for selected task
      $(ttListEntry).find('.task-list-entry-control a').fadeIn();  
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
    viewModel.notes.removeAll();
    
    ko.utils.arrayForEach(notes, function(note){
      viewModel.notes.push(new Note(note));
    });
  });
  
  /**
   * Adds a new note to the selected task.
   */
  function addNote(note) {
    addon.port.emit("AddNote", ko.toJSON(note));
  }

  addon.port.on("NoteAdded", function(note) {
    viewModel.notes.unshift(new Note(note));
  });
  
  /**
   * Saves changes to an existing note.
   */
  function updateNote(note) {
    addon.port.emit("UpdateNote", ko.toJSON(note));
  }

  addon.port.on("NoteUpdated", function(note) {
  });
  
  /**
   * Deletes an existing note.
   */
  function deleteNote(note) {
    // addon.port.emit("DeleteNote", note);
    note.deleted(true);
    updateNote(note);
    viewModel.notes.remove(note);
  }

  addon.port.on("NoteDeleted", function(data) {
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
    viewModel.bookmarks.removeAll();
    
    ko.utils.arrayForEach(bookmarks, function(bookmark){
      viewModel.bookmarks.push(new Bookmark(bookmark));
    });

    // Call main.js to set bookmarks of active task
    addon.port.emit("SetActiveTaskBookmarks", bookmarks);
  });
  
  /**
   * Adds a new bookmark to the selected task.
   */
  function addBookmark(bookmark) {
    addon.port.emit("AddBookmark", ko.toJSON(bookmark));
  }

  addon.port.on("BookmarkAdded", function(bookmark) {
    viewModel.bookmarks.unshift(new Bookmark(bookmark));
  });
  
  /**
   * Saves changes to an existing bookmark.
   */
  function updateBookmark(bookmark) {
    addon.port.emit("UpdateBookmark", ko.toJSON(bookmark));
  }

  addon.port.on("BookmarkUpdated", function(bookmark) {
  });
  
  /**
   * Deletes an existing bookmark.
   */
  function deleteBookmark(bookmark) {
    bookmark.deleted(true);
    updateBookmark(bookmark);
    viewModel.bookmarks.remove(bookmark);
  }

  addon.port.on("BookmarkDeleted", function(data) {
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
    viewModel.tabs.removeAll();
    
    ko.utils.arrayForEach(tabs, function(tab){
      viewModel.tabs.push(new Tab(tab));
    });
  });
  
  /**
   * Adds a new tab to the selected task.
   */
  function addTab(tab) {
    addon.port.emit("AddTab", ko.toJSON(tab));
  }

  addon.port.on("TabAdded", function(tab) {
    viewModel.tabs.push(new Tab(tab));
  });
  
  /**
   * Saves changes to an existing tab.
   */
  function updateTab(tab) {
    addon.port.emit("UpdateTab", ko.toJSON(tab));
  }

  addon.port.on("TabUpdated", function(tab) {
  });
  
  /**
   * Deletes an existing tab.
   */
  function deleteTab(tab) {
    tab.deleted(true);
    updateTab(tab);
    viewModel.tabs.remove(tab);
  }

  addon.port.on("TabDeleted", function(data) {
  });

  /////////////////////////////////////////////////////////////////////////////
  // TASK: HISTORY                                                           //
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Loads all history regarding to the selected task.
   */
  function loadHistory(task) {
    addon.port.emit("LoadHistory", task);
  }

  addon.port.on("HistoryLoaded", function(history) {
    viewModel.history.removeAll();
    
    ko.utils.arrayForEach(history, function(entry){
      viewModel.history.push(new HistoryEntry(entry));
    });

    // Call main.js to set history of active task
    addon.port.emit("SetActiveTaskHistory", history);
  });
  
  /**
   * Adds a new history entry to the selected task.
   */
  function addHistoryEntry(entry) {
    addon.port.emit("AddHistoryEntry", ko.toJSON(entry));
  }

  addon.port.on("HistoryEntryAdded", function(entry) {
    viewModel.history.unshift(new HistoryEntry(entry));
  });
  
  /**
   * Saves changes to an existing history entry.
   */
  function updateHistoryEntry(entry) {
    addon.port.emit("UpdateHistoryEntry", ko.toJSON(entry));
  }

  addon.port.on("HistoryEntryUpdated", function(entry) {
  });
  
  /**
   * Deletes an existing history entry.
   */
  function deleteHistoryEntry(entry) {
    entry.deleted(true);
    updateHistoryEntry(entry);
    viewModel.history.remove(entry);
  }

  addon.port.on("HistoryEntryDeleted", function(data) {
  });

  /////////////////////////////////////////////////////////////////////////////
  // TASK: FILES                                                             //
  /////////////////////////////////////////////////////////////////////////////
   
});
