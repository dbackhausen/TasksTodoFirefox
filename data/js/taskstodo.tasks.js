var viewModel = new ViewModel();

function ViewModel() {
  var self = this;
  
  self.user = ko.observable();
  self.selectedGoal = ko.observable();
  self.goals = ko.observableArray();
  self.selectedTask = ko.observable();
  self.tasks = ko.observableArray();

  self.selectGoal = function(goal) {
    $('#content').animate({ left: 0 }, 'normal', function() {
      selectGoal(goal);
    });    
  };

  self.selectTask = function(task) {
    if (self.selectedTask == null || self.selectedTask._id == undefined || self.selectedTask._id !== task._id) {
      // Set task in model
      self.selectedTask = task;
      
      // Trigger task selection to addon script      
      addon.port.emit("SetActiveTask", ko.toJS(task));

      // Select the current task and show options
      showTaskSelection(self.selectedTask);

      // Load task notes   
      loadNotes(self.selectedTask);

      // Load task bookmarks (preload is necessary for page annotation)    
      loadBookmarks(self.selectedTask);

      // Load task browse history (preload is necessary for query overview)     
      loadHistory(self.selectedTask);
            
      // Load task search history (preload is necessary for query overview)     
      loadSearchHistory(self.selectedTask);
      
      // Load task tabs (preload is necessary for badge preview)     
      loadTabs(self.selectedTask);
      
      // Load task attachments (preload is necessary for badge preview)     
      loadAttachments(self.selectedTask);
    } else {
      // Reset selected task
      self.selectedTask = ko.observable();

      // Select the current task and show options
      showTaskSelection(null);

      // Trigger task selection to addon script      
      addon.port.emit("SetActiveTask", null);
    }
  };
  
  self.newTask = function() {
    if (self.selectedTask && self.selectedTask._id) {
      // Deselect current task
      $("li#" + self.selectedTask._id).find('div').removeClass('selected');
      // Hide task options for current task
      $("li#" + self.selectedTask._id).find('.tt-entry-options').hide();
    }

    // Set the new task as selected task
    self.selectedTask = ko.observable();

    $('#btn-task-form-button-new').hide(); // Hide "New" button
    $('#content').find('.tt-empty-list').hide(); // Hide empty-list div
    $('#tt-task-list').find('.tt-inline-edit:visible').hide(); // Hide all inline forms
    
    $('#new-task-form-input-title').val(null);
    $('#new-task-form').show('fast');
    $('#new-task-form-input-title').focus();

    // Reset width and height
    $('#new-task-form-input-title').css({"width":"", "height":"", "top": "", "left" : ""});
  };

  self.cancelNewTask = function() {
    self.selectedTask = ko.observable();

    $('#new-task-form').hide(); // Hide new task from
    $('#new-task-form-input-title').val(null);

    $('#btn-task-form-button-new').fadeIn("fast"); // Show "New" button
    $('#content').find('.tt-empty-list').fadeIn("fast"); // Show empty-list div
  };
  
  self.editTask = function(task) {
    if (self.selectedTask && self.selectedTask._id) {
      // Deselect current task
      $("li#" + self.selectedTask._id).find('div').removeClass('selected');
      // Hide task options for current task
      $("li#" + self.selectedTask._id).find('.tt-entry-options').hide();
      // Set a new task as selected task
      self.selectedTask = ko.observable();
    }
    
    $('#btn-task-form-button-new').hide(); // Hide "New" button
    $('#new-task-form:visible').hide(); // Hide new task from

    $('#tt-task-list').find('.tt-inline-edit:visible').hide(); // Hide open inline editors
    $('#tt-task-list #'+task._id).find('.tt-entry').hide(); // Hide current entry
    $('#tt-task-list #'+task._id+' .tt-inline-edit').fadeIn('fast'); // Show inline editor
    
    $('#edit-task-form-input-title').height($('#edit-task-form-input-title').prop('scrollHeight'));
  };

  self.cancelEditTask = function(task) {
    task.title.reset();

    $('#btn-task-form-button-new').show(); // Show "New" button
    $('#tt-task-list #'+task._id).find('.tt-entry').show(); // Show list entry
    $('#tt-task-list #'+task._id+' .tt-inline-edit').hide(); // Hide inline editor
  };

  self.addTask = function() {
    var title = $("#new-task-form-input-title").val();

    if (title && title.length > 0) {
      addTask(new Task({
        "goal" : self.selectedGoal()._id,
        "title" : title,
        "position" : self.tasks().length > 0 ? (self.tasks().length + 1) : 1,
        "level" : 0
      }));
    }

    self.cancelNewTask();
  };

  self.updateTask = function(task) {
    if (task && task.title() && task.title().length > 0) {
      task.title.commit();
      updateTask(task);
    } else if (task) {
      task.title.reset();
    }

    self.cancelEditTask(task);
  };

  self.deleteTask = function(task) {
    deleteTask(task);
    $('#content').find('.tt-empty-list').fadeIn("fast");  
  };

  self.completeTask = function(task) {
    if (task.completed() == null) {
      task.completed(new Date());
      updateTask(task);
    } else {
      task.completed(null);
      updateTask(task);
    }
  };

  self.showCompletedTasks = function() {
//    $('#tt-completed-tasks-list ol').fadeIn("fast");  
  };

  self.hideCompletedTasks = function() {
//    $('#tt-completed-tasks-list ol').fadeOut("fast");  
  };

  self.indentTask = function(task) {
    if (task != null && task.position() > 1) { // only allow indents where index > 1
      for (var i = task.position() - 2; i >= 0; i--) {  
        if ((task.level() + 1) - self.tasks()[i].level() == 0 
          || (task.level() + 1) - self.tasks()[i].level() == 1) { 
          // indent only if previous task is on same level or one lower
          //task.parentId(self.tasks()[i]._id);
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
        //task.parentId(null);
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
          //arg.item.parentId(null);
        } else {
          // Set the new parent
          //arg.item.parentId(self.tasks()[arg.targetIndex - 1]._id);
          arg.item.level(self.tasks()[arg.targetIndex - 1].level() + 1);
        }
      }

      updateTask(arg.item);

      // If task position has been modified
      ko.utils.arrayForEach(self.tasks(), function(task) {
        if (task._id != arg.item._id) {
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
              if ((task.level() - self.tasks()[i].level() == 1) /*&& task.parentId() != self.tasks()[i]._id*/) {
                // if task level is higher than the previous task, 
                // than set new parent
                //task.parentId(self.tasks()[i]._id);
                updateTask(task);
                // console.log("Setting parent of " + task.title() + " to " + self.tasks()[i].title());
                break;
              }
            }
          }
        }
      });

      if (self.selectedTask != null && self.selectedTask._id == arg.item._id) {
        showTaskSelection(arg.item);
      }
    }
  }

  // -- NOTES
  
  self.notes = ko.observableArray();

  self.loadNotes = function(task) {
    loadNotes(task);
  };

  self.newNote = function() {
    $('#btn-note-form-button-new').hide(); // Hide "New" button
    $('#modal-panel-notes').find('.tt-empty-list').hide(); // Hide empty-list div
    $('#tt-note-list').find('.tt-inline-edit:visible').hide(); // Hide all inline forms
    
    $('#new-note-form').fadeIn("fast");

    $('#new-note-form-input-body').focus();
    $('#new-note-form-input-body').css({"width":"", "height":"", "top": "", "left" : ""}); // Reset width and height
  };
  
  self.cancelNewNote = function() {
    $('#new-note-form').hide(); // Hide new entity form

    $('#new-note-form-input-body').val(null); // Reset value

    $('#btn-note-form-button-new').fadeIn("fast"); // Show "New" button
    $('#modal-panel-notes').find('.tt-empty-list').fadeIn("fast"); // Show empty-list div
  };
  
  self.addNote = function() {
    var body = $('#new-note-form-input-body').val();

    if (body != null && body.length > 0) {
      addNote(new Note({
        "task" : self.selectedTask._id,
        "body" : body,
        "created" : new Date(),
        "modified" : null
      }));        
    }

    self.cancelNewNote();
  };
  
  self.editNote = function(note) {
    $('#btn-note-form-button-new').hide(); // Hide "New" button
    $('#new-note-form:visible').hide(); // Hide new entity form
    $('#tt-note-list').find('.tt-inline-edit:visible').hide(); // Hide all open inline forms

    $('#tt-note-list #'+note._id+' .tt-entry').hide(); // Hide list entry
    $('#tt-note-list #'+note._id+' .tt-inline-edit').fadeIn('fast'); // Show inline form

    $('#edit-note-form-input-body'+note._id).focus();
  };

  self.cancelEditNote = function(note) {
    note.body.reset();
    
    $('#btn-note-form-button-new').show(); // Show "New" button
    $('#tt-note-list #'+note._id+' .tt-entry').fadeIn('fast'); // Show entry 
    $('#tt-note-list #'+note._id+' .tt-inline-edit').hide(); // Hide inline form
  };
  
  self.updateNote = function(note) {
    if (note && note.body() && note.body().length > 0) {
      note.body.commit();
      note.modified(new Date());
      updateNote(note);
    } else if (note) {
      note.body.reset();
    }

    self.cancelEditNote(note);
  };
  
  self.deleteNote = function(note) {
    deleteNote(note);
    $('#modal-panel-notes').find('.tt-empty-list').fadeIn("fast"); // Show empty-list div
  };   
  
  // -- BOOKMARKS
  
  self.bookmarks = ko.observableArray();
  
  self.loadBookmarks = function(task) {
    loadBookmarks(task);
  };

  self.newBookmark = function() {
    $('#btn-bookmark-form-button-new').hide(); // Hide "New" button
    $('#modal-panel-bookmarks').find('.tt-empty-list').hide(); // Hide empty-list div
    $('#tt-bookmarks-list').find('.tt-inline-edit:visible').hide(); // Hide all inline forms
    
    $('#new-bookmark-form').fadeIn("fast");
    $('#new-bookmark-form-input-title').focus();
  };
  
  self.cancelNewBookmark = function() {
    $('#new-bookmark-form').hide();

    $('#new-bookmark-form-input-title').val(null);
    $('#new-bookmark-form-input-url').val(null);
    $('#new-bookmark-form-input-description').val(null);    

    $('#btn-task-form-button-new').fadeIn("fast"); // Show "New" button
    $('#modal-panel-bookmarks').find('.tt-empty-list').fadeIn("fast"); // Show empty-list div
  };
  
  self.addBookmark = function() {
    var title = $('#new-bookmark-form-input-title').val();
    var url = $('#new-bookmark-form-input-url').val();
    var description = $('#new-bookmark-form-input-description').val();

    if (false || title.length > 0 && url.length > 0) {
      addBookmark(new Bookmark({ 
        "task" : self.selectedTask._id,
        "title" : title, 
        "url" : url,
        "description" : description,
        "created" : new Date(),
        "modified" : null
      }));
    } else {
      // TODO show error!
    }

    self.cancelNewBookmark();      
  };
  
  self.editBookmark = function(bookmark) {
    $('#btn-bookmark-form-button-new').hide();
    $('#new-bookmark-form:visible').hide();
    $('#tt-bookmarks-list').find('.tt-inline-edit:visible').hide(); // Hide all open inline forms

    $('#tt-bookmarks-list #'+bookmark._id+' .tt-entry').hide(); // Hide list entry
    $('#tt-bookmarks-list #'+bookmark._id+' .tt-inline-edit').fadeIn('fast'); // Show inline form

    $('#edit-bookmark-form-input-title-'+bookmark._id).focus();
  };

  self.cancelEditBookmark = function(bookmark) {
    bookmark.title.reset();
    bookmark.url.reset();
    bookmark.description.reset();
    
    $('#btn-bookmark-form-button-new').show();
    $('#tt-bookmarks-list #'+bookmark._id+' .tt-inline-edit').hide(); // Hide inline form
    $('#tt-bookmarks-list #'+bookmark._id+' .tt-entry').fadeIn('fast'); // Show list entry
  };
  
  self.updateBookmark = function(bookmark) {
    if (bookmark && bookmark.title() && bookmark.url() 
      && bookmark.title().length > 0 && bookmark.url().length > 0) {
      bookmark.title.commit();
      bookmark.url.commit();
      bookmark.description.commit();
      bookmark.modified(new Date());
      updateBookmark(bookmark);
    } else if (bookmark) {
      bookmark.title.reset();
      bookmark.url.reset();
      bookmark.description.reset();
    }

    self.cancelEditBookmark(bookmark);
  };
  
  self.deleteBookmark = function(bookmark) {
    deleteBookmark(bookmark);
    $('#modal-panel-bookmarks').find('.tt-empty-list').fadeIn("fast"); // Show empty-list div
  };

  // -- BROWSE HISTORY
  
  self.history = ko.observableArray();
  
  self.loadHistory = function(task) {
    loadHistory(task);
  };

  self.deleteHistoryEntry = function(entry) {
    deleteHistoryEntry(entry);
    
    if (self.history.length == 0) {
      $('#modal-panel-history').find('.tt-empty-list').fadeIn("fast"); // Show empty-list div
    }
  };
  
  self.clearHistory = function() {
    clearHistory(self.selectedTask);
    
    $('#modal-panel-history').find('.tt-empty-list').fadeIn("fast"); // Show empty-list div
  }

  // -- SEARCH HISTORY
  
  self.searchHistory = ko.observableArray();
  
  self.loadSearchHistory = function(task) {
    loadSearchHistory(task);
  };

  self.deleteSearchHistoryEntry = function(entry) {
    deleteSearchHistoryEntry(entry);
    $('#modal-panel-search_history').find('.tt-empty-list').fadeIn("fast"); // Show empty-list div
  };
  
  // -- TABS
  
  self.tabs = ko.observableArray();
  
  self.loadTabs = function(task) {
    loadTabs(task);
  };

  self.deleteTab = function(tab) {
    deleteTab(tab);
    $('#modal-panel-history').find('.tt-empty-list').fadeIn("fast"); // Show empty-list div
  };
  
  self.restoreTabs = function() {
    ko.utils.arrayForEach(self.tabs(), function(tab) {
      addon.port.emit("RestoreTab", ko.toJSON(tab));
    });
  }

  // -- ATTACHMENTS
  
  self.attachments = ko.observableArray();
  
  self.loadAttachments = function(task) {
    loadAttachments(task);
  };
  
  self.deleteAttachment = function(attachment) {
    deleteAttachment(attachment);
    $('#modal-panel-attachments').find('.tt-empty-list').fadeIn("fast"); // Show empty-list div
  };

  self.downloadAttachment = function(attachment) {
    downloadAttachment(attachment);
  };
  
  // -- LOG
  
  self.log = ko.observableArray();
  
  self.loadLog = function() {
    console.log("Loading user log");
  };
  
  self.deleteLogEntry = function(entry) {
  };
};

/**
 * File upload droparea
 */ 
ko.bindingHandlers.droparea = {
  init: function (element, valueAccessor) {
    var currentValue = valueAccessor();
    $(element)
      .on('dragenter', function (event) {
        //-------------------------------
        $(this).addClass('dragover');
        event.preventDefault();
        return false;
      }).on('dragover', function (event) {
        //--------------------------------
        event.preventDefault();
        return false;
      }).on('dragleave', function (event) {
        //---------------------------------
        $(this).removeClass('dragover');
      }).on('drop', function (event) {
        //----------------------------------
        if (currentValue.drop !== undefined)
          currentValue.drop(event.originalEvent);
        // restore style
        $(this).removeClass('dragover');
        event.preventDefault(); // I'm not sure if this is required
        return false;
      });
  },
};

/**
 * File upload handler
 */ 
ko.bindingHandlers.uploader = {
  init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
    var uploadFiles = function(event) {
      var dt = event.dataTransfer;

      if (dt !== undefined && dt.files !== undefined) {

        for (var i=0; i<dt.files.length; i++) {
          (function(file) {
            var fileReader = new FileReader();
            
            fileReader.onload = function(e) {
              filetype = 'application/octet-stream';

              if (file.type != '') {
                filetype = file.type;
              }

              console.log("Upload file " + file.name + " (" + file.type + ")")
              addAttachment(viewModel.selectedTask, e.target.result, file.name, filetype);
            }

            fileReader.readAsBinaryString(file);
          })(dt.files[i]);
        }
      }
    }

    // apply bindings to child nodes
    var innerBindingContext = bindingContext.extend({
       uploadFiles: uploadFiles,
    });
    ko.applyBindingsToDescendants(innerBindingContext, element);

    // tell that we're managing bindings of descendants
    return { controlsDescendantBindings: true };
  },

  update: function (element, valueAccessor) {
  },
};

/////////////////////////////////////////////////////////////////////////////
// USER                                                                    //
/////////////////////////////////////////////////////////////////////////////

/**
 * Saves changes to the user.
 */
function updateUser(user) {
  user.modified(new Date());
  addon.port.emit("UpdateUser", ko.toJSON(user));
}

addon.port.on("UserUpdated", function(user) {
  console.log("User data has been updated");
});

/////////////////////////////////////////////////////////////////////////////
// GOAL                                                                    //
/////////////////////////////////////////////////////////////////////////////

/**
 * Callback method, when goals are loaded.
 */
addon.port.on("GoalsLoaded", function(goals) {
  // Clear view
  viewModel.goals.removeAll();
  
  ko.utils.arrayForEach(goals, function(goal) {
    // Add goal to view
    viewModel.goals.push(new Goal(goal));
  });
});

/**
 * Selects a goal.
 */
function selectGoal(goal) {
  // Set goal selection to addon script      
  addon.port.emit("SetActiveGoal", ko.toJS(goal));
  
  // Log goal selection
  addLogEntry(viewModel.user()._id, "goal_selected", ko.toJS(goal)._id);

  // Load active goal
  addon.port.emit("GetActiveGoal");
}

/**
 * Callback method, when active goal is loaded.
 */
addon.port.on("ActiveGoalLoaded", function(goal) {
  // Set active goal for page binding
  viewModel.selectedGoal(new Goal(goal));

  // Load all tasks
  loadTasks(viewModel.selectedGoal());

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
  $('#content .tt-loader').show();
  addon.port.emit("LoadTasks", goal);
}

addon.port.on("TasksLoaded", function(tasks) { 
  $('#content .tt-loader').hide();
  
  // Clear view
  viewModel.tasks.removeAll();

  if (tasks && tasks.length > 0) {  
    ko.utils.arrayForEach(tasks, function(task) {
      viewModel.tasks.push(new Task(task));
    });
    
    if (viewModel.selectedTask != null && viewModel.selectedTask._id != undefined) {   
      // Select the current task and show options
      showTaskSelection(viewModel.selectedTask);
    }
  } else {
    $('#content .tt-empty-list').show();
  }
});

/**
 * Adds a new task to the project.
 */
function addTask(task) {
  addon.port.emit("AddTask", ko.toJS(task));
}

addon.port.on("TaskAdded", function(data) {
  viewModel.tasks.push(new Task(data));
});

/**
 * Saves changes to an existing task.
 */
function updateTask(task) {
  addon.port.emit("UpdateTask", ko.toJS(task));
}

addon.port.on("TaskUpdated", function(task) {
});

/**
 * Deletes an existing task.
 */
function deleteTask(task) {
  var position = task.position();
  
  // Delete task from database
  addon.port.emit("DeleteTask", ko.toJS(task));
  
  // Remove task from view  
  viewModel.tasks.remove(task);
  
  // Update all other tasks
  ko.utils.arrayForEach(viewModel.tasks(), function(t) {
    if (t.position() > position) {
      t.position(t.position() - 1);
      
      addon.port.emit("UpdateTask", ko.toJS(t));
    }
  });
}

addon.port.on("TaskDeleted", function(data) {
});

/**
 * Callback method, when active task is loaded.
 */
addon.port.on("ActiveTaskLoaded", function(task) {
  if (task) {

    // Set task in view model
    viewModel.selectedTask = new Task(task);
    
    // Load task notes   
    loadNotes(viewModel.selectedTask);

    // Load task bookmarks (preload is necessary for page annotation)    
    loadBookmarks(viewModel.selectedTask);

    // Load task browse history (preload is necessary for query overview)     
    loadHistory(viewModel.selectedTask);

    // Load task search history (preload is necessary for query overview)     
    loadSearchHistory(viewModel.selectedTask);

    // Load task tabs (preload is necessary for badge preview)     
    loadTabs(viewModel.selectedTask);

    // Load task attachments (preload is necessary for badge preview)     
    loadAttachments(viewModel.selectedTask);
  }
});

/**
 * Selects a task.
 */
function showTaskSelection(task) {
  // Disable all inline editors
  $('#tt-task-list').find('.tt-inline-edit').hide();
  $('#tt-task-list').find('.tt-entry').show();

  // Hide new task form and show "New" button
  $('#new-task-form').hide();
  $('#btn-task-form-button-new').fadeIn("fast");

  // Disable all other task selections
  $('#tt-task-list').find('.selected').removeClass('selected');
  // Hide all visible options, before showing another one  
  $('#tt-task-list').find('.tt-entry-options:visible').not($(ttListEntry).find('.tt-entry-options')).hide();
  
  if (task != null && task._id != undefined) {
    // Make sure the input field value is set
    $("#edit-task-form-input-title").val(task.title());

    // Get list entry
    var ttListEntry = $("li#" + task._id);

    // Select current list entry
    $(ttListEntry).find('div').addClass('selected');

    // Show options for selected task
    $(ttListEntry).find('.tt-entry-options').fadeIn();

    // Show options for selected task
    $(ttListEntry).find('.tt-task-control a').fadeIn();  
  }
}

/////////////////////////////////////////////////////////////////////////////
// TASK: NOTES                                                             //
/////////////////////////////////////////////////////////////////////////////

/**
 * Loads all notes regarding to the selected task.
 */
function loadNotes(task) {
  $('#modal-panel-notes .tt-loader').show();
  addon.port.emit("LoadNotes", task);
}

addon.port.on("NotesLoaded", function(notes) {
  $('#modal-panel-notes .tt-loader').hide();
  
  // Clear view
  viewModel.notes.removeAll();

  if (notes && notes.length > 0) {
    ko.utils.arrayForEach(notes, function(note){
      viewModel.notes.push(new Note(note));
    });
    
    var badgeCount = viewModel.notes().length < 10 ? viewModel.notes().length : "*";

    // Set badge counts for notes 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-clipboard').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-clipboard').attr('badge-count', badgeCount); 
  } else {
    $('#modal-panel-notes .tt-empty-list').show();

    // Set badge counts for notes 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-clipboard').removeClass('cntbadge');
  }
});

/**
 * Adds a new note to the selected task.
 */
function addNote(note) {
  addon.port.emit("AddNote", ko.toJS(note));
}

addon.port.on("NoteAdded", function(note) {
  // Add note to view
  viewModel.notes.unshift(new Note(note));

  if (viewModel.notes() && viewModel.notes().length > 0) {
    var badgeCount = viewModel.notes().length < 10 ? viewModel.notes().length : "*";
    
    // Set badge counts for notes 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-clipboard').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-clipboard').attr('badge-count', badgeCount);
  } else {
    // Set badge counts for notes 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-clipboard').removeClass('cntbadge');
  }
});

/**
 * Saves changes to an existing note.
 */
function updateNote(note) {
  addon.port.emit("UpdateNote", ko.toJS(note));
}

addon.port.on("NoteUpdated", function(note) {
});

/**
 * Deletes an existing note.
 */
function deleteNote(note) {
  // Delete note from database
  addon.port.emit("DeleteNote", ko.toJS(note));
    
  // Remove note from view
  viewModel.notes.remove(note);
}

addon.port.on("NoteDeleted", function(data) {
  if (viewModel.notes() && viewModel.notes().length > 0) {
    var badgeCount = viewModel.notes().length < 10 ? viewModel.notes().length : "*";
    
    // Set badge counts for notes 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-clipboard').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-clipboard').attr('badge-count', badgeCount);
  } else {
    // Set badge counts for notes 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-clipboard').removeClass('cntbadge');
  }
});

/////////////////////////////////////////////////////////////////////////////
// TASK: BOOKMARKS                                                         //
/////////////////////////////////////////////////////////////////////////////

/**
 * Loads all bookmarks regarding to the selected task.
 */
function loadBookmarks(task) {
  $('#modal-panel-bookmarks .tt-loader').show();
  addon.port.emit("LoadBookmarks", task);
}

addon.port.on("BookmarksLoaded", function(bookmarks) {
  $('#modal-panel-bookmarks .tt-loader').hide();
  
  // Clear view
  viewModel.bookmarks.removeAll();

  if (bookmarks && bookmarks.length > 0) {
    ko.utils.arrayForEach(bookmarks, function(bookmark){
      viewModel.bookmarks.push(new Bookmark(bookmark));
    });
    
    var badgeCount = viewModel.bookmarks().length < 10 ? viewModel.bookmarks().length : "*";

    // Set badge counts for bookmarks 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-link').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-link').attr('badge-count', badgeCount);
  } else {
    $('#modal-panel-bookmarks .tt-empty-list').show();

    // Set badge counts for bookmarks 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-link').removeClass('cntbadge');
  }  

  // Call FF addon to set bookmarks of active task
  addon.port.emit("SetActiveTaskBookmarks", bookmarks);
});

/**
 * Adds a new bookmark to the selected task.
 */
function addBookmark(bookmark) {
  addon.port.emit("AddBookmark", ko.toJS(bookmark));
}

addon.port.on("BookmarkAdded", function(bookmark) {
  // Add bookmark to view
  viewModel.bookmarks.unshift(new Bookmark(bookmark));

  if (viewModel.bookmarks && viewModel.bookmarks().length > 0) {
    var badgeCount = viewModel.bookmarks().length < 10 ? viewModel.bookmarks().length : "*";
    
    // Set badge counts for bookmarks 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-link').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-link').attr('badge-count', badgeCount);
  } else {
    // Set badge counts for bookmarks 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-link').removeClass('cntbadge');
  }
});

/**
 * Saves changes to an existing bookmark.
 */
function updateBookmark(bookmark) {
  addon.port.emit("UpdateBookmark", ko.toJS(bookmark));
}

addon.port.on("BookmarkUpdated", function(bookmark) {
  // Reload the bookmarks
  loadBookmarks(viewModel.selectedTask);
});

/**
 * Deletes an existing bookmark.
 */
function deleteBookmark(bookmark) {
  // Delete bookmark from database
  addon.port.emit("DeleteBookmark", ko.toJS(bookmark));  
  
  // Remove bookmark from view
  viewModel.bookmarks.remove(bookmark);
  
  if (viewModel.bookmarks && viewModel.bookmarks().length > 0) {
    var badgeCount = viewModel.bookmarks().length < 10 ? viewModel.bookmarks().length : "*";
    
    // Set badge counts for bookmarks 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-link').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-link').attr('badge-count', badgeCount);
  } else {
    // Set badge counts for bookmarks 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-link').removeClass('cntbadge');
  }
}

addon.port.on("BookmarkDeleted", function() {
  // Reload the bookmarks
  loadBookmarks(viewModel.selectedTask);
});

/////////////////////////////////////////////////////////////////////////////
// TASK: BROWSE HISTORY                                                    //
/////////////////////////////////////////////////////////////////////////////

/**
 * Loads all history regarding to the selected task.
 */
function loadHistory(task) {
  $('#modal-panel-history .tt-loader').show();
  addon.port.emit("LoadHistory", task);
}

addon.port.on("HistoryLoaded", function(history) {
  $('#modal-panel-history .tt-loader').hide();
  
  // Clear view
  viewModel.history.removeAll();

  if (history && history.length > 0) { 
    ko.utils.arrayForEach(history, function(entry) {
      viewModel.history.push(new HistoryEntry(entry));
    });
  } else {
    $('#modal-panel-history .tt-empty-list').show();
  }
  
  if (viewModel.history && viewModel.history().length > 0) {
    var badgeCount = viewModel.history().length < 10 ? viewModel.history().length : "*";
    
    // Set badge counts for history 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-history').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-history').attr('badge-count', badgeCount);
  } else {
    // Set badge counts for history 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-history').removeClass('cntbadge');
  }

  // Call FF addon to set history of active task
  addon.port.emit("SetActiveTaskHistory", history);
});

/**
 * Deletes an existing history entry.
 */
function deleteHistoryEntry(entry) {
  // Delete history entry from database
  addon.port.emit("DeleteLogEntry", entry._id);

  // Remove history entry from view
  viewModel.history.remove(entry);
  
  if (viewModel.history && viewModel.history().length > 0) {
    var badgeCount = viewModel.history().length < 10 ? viewModel.history().length : "*";
    
    // Set badge counts for history 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-history').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-history').attr('badge-count', badgeCount);
  } else {
    // Set badge counts for history 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-history').removeClass('cntbadge');
  }
}

/**
 * Clears the complete task history.
 */
function clearHistory(task) {
  // Delete all history entries from database
  addon.port.emit("ClearHistory", task._id);

  // Remove all history entries from view
  viewModel.history.removeAll();
  
  if (viewModel.history && viewModel.history().length > 0) {
    var badgeCount = viewModel.history().length < 10 ? viewModel.history().length : "*";
    
    // Set badge counts for history 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-history').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-history').attr('badge-count', badgeCount);
  } else {
    // Set badge counts for history 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-history').removeClass('cntbadge');
  }
}

/////////////////////////////////////////////////////////////////////////////
// TASK: SEARCH HISTORY                                                    //
/////////////////////////////////////////////////////////////////////////////

/**
 * Filters all search history regarding to the selected task.
 */
function loadSearchHistory(task) {
  $('#modal-panel-search_history .tt-loader').show();
  addon.port.emit("LoadSearchHistory", task);
}

addon.port.on("SearchHistoryLoaded", function(history) {
  $('#modal-panel-search_history .tt-loader').hide();
  
  viewModel.searchHistory.removeAll();

  if (history && history.length > 0) { 
    ko.utils.arrayForEach(history, function(entry) {
      viewModel.searchHistory.push(new Query(entry));
    });
  } else {
    $('#modal-panel-search_history .tt-empty-list').show();
  }
  
  if (viewModel.searchHistory && viewModel.searchHistory().length > 0) {
    var badgeCount = viewModel.searchHistory().length < 10 ? viewModel.searchHistory().length : "*";
    
    // Set badge counts for history 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-search').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-search').attr('badge-count', badgeCount);
  } else {
    // Set badge counts for history 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-search').removeClass('cntbadge');
  }
});

/**
 * Delete an existing search history entry.
 */
function deleteSearchHistoryEntry(entry) {
  // Delete entry from database
  addon.port.emit("DeleteLogEntry", entry._id);

  // Remove entry from list
  viewModel.searchHistory.remove(entry);
  
  if (viewModel.searchHistory && viewModel.searchHistory().length > 0) {
    var badgeCount = viewModel.searchHistory().length < 10 ? viewModel.searchHistory().length : "*";
    
    // Set badge counts for history 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-search').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-search').attr('badge-count', badgeCount);
  } else {
    // Set badge counts for history 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-search').removeClass('cntbadge');
  }
  
  // Reload search history
  loadSearchHistory(viewModel.selectedTask);
}

/////////////////////////////////////////////////////////////////////////////
// TASK: TABS                                                              //
/////////////////////////////////////////////////////////////////////////////

/**
 * Load all tabs regarding to the selected task.
 */
function loadTabs(task) {
  $('#modal-panel-tabs .tt-loader').show();
  addon.port.emit("LoadTabs", task);
}

addon.port.on("TabsLoaded", function(tabs) {
  $('#modal-panel-tabs .tt-loader').hide();
  
  // Clear view
  viewModel.tabs.removeAll();

  if (tabs && tabs.length > 0) { 
    ko.utils.arrayForEach(tabs, function(tab) {
      viewModel.tabs.push(new Tab(tab));
    });
  } else {
    $('#modal-panel-tabs .tt-empty-list').show();
  }
  
  if (viewModel.tabs && viewModel.tabs().length > 0) {
    var badgeCount = viewModel.tabs().length < 10 ? viewModel.tabs().length : "*";
    
    // Set badge counts for tabs 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-folder-o').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-folder-o').attr('badge-count', badgeCount);
  } else {
    // Set badge counts for tabs 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-folder-o').removeClass('cntbadge');
  }
  
  // Call FF addon to set tabs of active task
  addon.port.emit("SetActiveTaskTabs", tabs);
});

/**
 * Store open tabs.
 */
function storeTabs() {
  addon.port.emit("StoreTabs");
}

/**
 * Restore all tabs.
 */
function restoreTabs(tabs) {
  addon.port.emit("RestoreTabs", tabs);
}

/**
 * Deletes an existing tab.
 */
function deleteTab(entry) {
  // Delete entry from database
  addon.port.emit("DeleteTab", entry);
    
  // Remove entry from view
  viewModel.tabs.remove(entry);
}

addon.port.on("TabDeleted", function(data) {
  if (viewModel.tabs && viewModel.tabs().length > 0) {
    var badgeCount = viewModel.tabs().length < 10 ? viewModel.tabs().length : "*";
    
    // Set badge counts for tabs 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-folder-o').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-folder-o').attr('badge-count', badgeCount);
  } else {
    // Set badge counts for tabs 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-folder-o').removeClass('cntbadge');
  }
});

/////////////////////////////////////////////////////////////////////////////
// TASK: ATTACHMENTS                                                       //
/////////////////////////////////////////////////////////////////////////////

/**
 * Load all attachments regarding to the selected task.
 */
function loadAttachments(task) {
  $('#modal-panel-attachments .tt-loader').show();
  addon.port.emit("LoadAttachments", task);
}

addon.port.on("AttachmentsLoaded", function(attachments) {
  $('#modal-panel-attachments .tt-loader').hide();
  
  // Clear view
  viewModel.attachments.removeAll();

  if (attachments && attachments.length > 0) {
    ko.utils.arrayForEach(attachments, function(attachment) {
      viewModel.attachments.push(new Attachment(attachment));
    });
    
    var badgeCount = viewModel.attachments().length < 10 ? viewModel.attachments().length : "*";

    // Set badge counts for attachments 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-paperclip').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-paperclip').attr('badge-count', badgeCount);
  } else {
    $('#modal-panel-attachments .tt-empty-list').show();

    // Set badge counts for attachments 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-paperclip').removeClass('cntbadge');
  }
});

/**
 * Add an attachment.
 */
function addAttachment(task, data, filename, filetype) {
  $('#tt-attachments-list .tt-droparea-text').hide();
  $('#tt-attachments-list .tt-droparea-loader').show();
  addon.port.emit("AddAttachment", task, data, filename, filetype);
}

addon.port.on("AttachmentAdded", function() {            
  $('#tt-attachments-list .tt-droparea-text').show();
  $('#tt-attachments-list .tt-droparea-loader').hide();
  
  loadAttachments(viewModel.selectedTask);
});

/**
 * Delete an existing attachment.
 */
function deleteAttachment(attachment) {
  // Delete attachment from database
  addon.port.emit("DeleteAttachment", attachment);
  
  // Remove attachment from view
  viewModel.attachments.remove(attachment);
}

addon.port.on("AttachmentDeleted", function(data) {
  if (viewModel.attachments && viewModel.attachments().length > 0) {
    // Set badge counts for attachments 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-paperclip').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-paperclip').attr('badge-count', viewModel.attachments().length);
  } else {
    // Set badge counts for attachments 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-paperclip').removeClass('cntbadge');
  }
});

/**
 * Download an attachment.
 */
function downloadAttachment(attachment) {
  addon.port.emit("DownloadAttachment", attachment);

  if (viewModel.attachments && viewModel.attachments().length > 0) {
    // Set badge counts for attachments 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-paperclip').addClass('cntbadge');
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-paperclip').attr('badge-count', viewModel.attachments().length);
  } else {
    // Set badge counts for attachments 
    $("li#" + viewModel.selectedTask._id).find('.tt-entry-options:visible .fa-paperclip').removeClass('cntbadge');
  }
}

/*
 * ON PAGE READY
 */
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
      viewModel.user(new User(JSON.parse(user)));

      // Load all user goals
      addon.port.emit("LoadGoals", viewModel.user());

      // Get the active goal
      addon.port.emit("GetActiveGoal");
          
      // Get the active task
      addon.port.emit("GetActiveTask");
    }
  });

  // Apply view model
  ko.applyBindings(viewModel);
});
