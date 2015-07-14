var viewModel = new ViewModel();

function ViewModel() {
  var self = this;
  
  self.user = ko.observable();
  self.selectedGoal = ko.observable();
  self.goals = ko.observableArray();
  self.latestTask = ko.observable();
  
  self.selectGoal = function(goal) {
    self.selectedGoal = goal;
    selectGoal(goal);
  };
  
  self.newGoal = function() {
    self.selectedGoal = ko.observable();
    
    $('#new-goal-form-button-new').hide(); // Hide "New" button
    $('#content').find('.tt-empty-list').hide(); // Hide empty-list div
    $('#tt-goal-list').find('.tt-inline-edit:visible').hide(); // Hide all inline forms

    $('#new-goal-form-input-title').val(null);
    $('#new-goal-form').show('fast');
    $('#new-goal-form-input-title').focus();
    
    // Reset width and height
    $('#new-goal-form-input-title').css({"width":"", "height":"", "top": "", "left" : ""});
  };
  
  self.cancelNewGoal = function() {
    self.selectedGoal = ko.observable();

    $("#new-goal-form").hide(); // Hide new goal from
    $("#new-goal-form-input-title").val(null);

    $('#new-goal-form-button-new').fadeIn("fast"); // Show "New" button
    $('#content').find('.tt-empty-list').fadeIn("fast"); // Show empty-list div
  };
  
  self.editGoal = function(goal) {
    $('#new-goal-form-button-new').hide(); // hide new button
    $('#new-goal-form:visible').hide(); // hide new goal form

    $('#tt-goal-list').find('.tt-inline-edit:visible').hide();  // Hide open inline editors
    $('#'+goal._id).find('.tt-entry').hide(); // Hide current entry
    $('#'+goal._id+' .tt-inline-edit').fadeIn('fast'); // Show inline editor
    
    $('#edit-goal-form-input-title').height($('#edit-goal-form-input-title').prop('scrollHeight'));
  };
  
  self.cancelEditGoal = function(goal) {
    goal.title.reset();

    $('#new-goal-form-button-new').show(); // Show "New" button
    $('#'+goal._id).find('.tt-entry').show(); // Show list entry
    $('#'+goal._id+' .tt-inline-edit').hide(); // Hide inline editor
  };

  self.addGoal = function() {
    var title = $("#new-goal-form-input-title").val();
    
    if (title && title.length > 0) {
      addGoal(new Goal({ 
        "userId" : self.user()._id,
        "title" : title,
        "description" : "",
        "position" : self.goals().length > 0 ? (self.goals().length + 1) : 1,
        "level" : 0,
        "urgency" : 0,
        "priority" : 0,
        "created" : new Date(),
        "modified" : null
      }));
    }

    self.cancelNewGoal();
  };

  self.updateGoal = function(goal) {
    if (goal && goal.title() && goal.title().length > 0) {
      goal.title.commit();
      goal.modified(new Date());
      updateGoal(goal);
    } else if (goal) {
      goal.title.reset();
    }

    self.cancelEditGoal(goal);
  };

  self.deleteGoal = function(goal) {
    deleteGoal(goal);
    $('#content').find('.tt-empty-list').fadeIn("fast");
  };

  self.completeGoal = function(goal) {
    if (goal.completed()) {
      goal.completed(false);
      goal.completedDate(null);
      updateGoal(goal);
    } else {
      goal.completed(true);
      goal.completedDate(new Date());
      updateGoal(goal);
    }
  };

  self.showCompletedGoals = function() {
//    $('#tt-completed-goals-list ol').fadeIn("fast");  
  };

  self.hideCompletedGoals = function() {
//    $('#tt-completed-goals-list ol').fadeOut("fast");  
  };

  self.moveGoal = function(arg, event, ui) {
    console.log(arg.item.title() + " dragged from " + arg.sourceIndex + " to " + arg.targetIndex);

    if (arg.sourceIndex != arg.targetIndex) {
      arg.item.position(arg.targetIndex + 1);

      if (arg.item.level() > 0) {
        // If goal is a subtask
        if (arg.targetIndex == 0) {
          // If goal is moved to the top, the
          // goal level has to be set to 0
          arg.item.level(0);
          // and the parent has to be set to 0
          arg.item.parentId(null);
        } else {
          // Set the new parent
          arg.item.parentId(self.goals()[arg.targetIndex - 1]._id);
        }
      }

      updateGoal(arg.item);

      // If goal position has been modified
      ko.utils.arrayForEach(self.goals(), function(goal) {
        // console.log(self.tasks.indexOf(goal) + ": " + goal.title);
        if (goal._id != arg.item._id) {
          if (arg.sourceIndex < arg.targetIndex) {
            // Task has been moved to a lower position
            if (goal.position() > (arg.sourceIndex + 1) && goal.position() <= (arg.targetIndex + 1)) {
              goal.position(goal.position() - 1);
              updateGoal(goal);
              // console.log("Setting " + goal.title() + " to position " + goal.position());
            }
          } else {
            // Task has been moved to a higher position
            if (goal.position() < (arg.sourceIndex + 1) && goal.position() >= (arg.targetIndex + 1)) {
              goal.position(goal.position() + 1);
              updateGoal(goal);
              // console.log("Setting " + goal.title() + " to position " + goal.position());
            }
          }
        }
      });
    }
  };
  
  // -- LOG
  
  self.log = ko.observableArray();
  
  self.loadLog = function() {
    console.log("Loading user log");
  };
  
  self.deleteLogEntry = function(entry) {
  };
}

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
 * Loads all goals.
 */
function loadGoals(user) {
  $('#content .tt-loader').show();
  addon.port.emit("LoadGoals", user);
}

addon.port.on("GoalsLoaded", function(goals) {
  $('#content .tt-loader').hide();
  viewModel.goals.removeAll();

  if (goals && goals.length > 0) {
    ko.utils.arrayForEach(goals, function(goal) {
      viewModel.goals.push(new Goal(goal));
    });
  } else {
    $('#content .tt-empty-list').show();
  }
});
  
/**
 * Adds a new goal.
 */
function addGoal(goal) {
  addon.port.emit("AddGoal", ko.toJSON(goal));
}

addon.port.on("GoalAdded", function(goal) {
  viewModel.goals.push(new Goal(goal));
});

/**
 * Saves changes to an existing goal.
 */
function updateGoal(goal) {
  //goal.modified(new Date());
  addon.port.emit("UpdateGoal", ko.toJSON(goal));
}

addon.port.on("GoalUpdated", function(goal) {
  console.log("Goal '" + goal.title + "' has been updated");
});

/**
 * Deletes an existing goal.
 */
function deleteGoal(goal) {
  // addon.port.emit("DeleteGoal", goal);
  goal.deleted(new Date());
  goal.position(-1);
  goal.parentId(null);
  goal.level(0);
  
  updateGoal(goal);

  viewModel.goals.remove(goal);
}

addon.port.on("GoalDeleted", function(goal) {
});

/**
 * Selects a goal.
 */
function selectGoal(goal) {
  if (goal != null) {
    // trigger goal selection to addon script      
    addon.port.emit("SetActiveGoal", ko.toJS(goal));

    // Redirect to tasks page
    addon.port.emit("Redirect", "tasks.html");
  }
}

var latestTaskId = null;

addon.port.on("LatestLogEntriesLoaded", function(entries) {
  console.log(JSON.stringify(entries));

  if (entries && entries.length > 0) { 
    ko.utils.arrayForEach(entries, function(entry) {
      if (entry.action === "task_selected") {
        for (i = 0; i < entry.parameters.length; i++) { 
          var parameter = entry.parameters[i];

          if (parameter.key == "taskId" && parameter.value != null && parameter.value.length > 0) {
//            
            latestTaskId = parameter.value;
            addon.port.emit("LoadTask", parameter.value);
          }
        }
      }
    });
  }
});

addon.port.on("TaskLoaded", function(task) {
  if (task._id == latestTaskId) {
    console.log("Latest task was " + task.title);
    viewModel.latestTask = ko.observable(task);
  }
});
              

/*
 * ON PAGE READY
 */
$(document).ready(function() {

  ko.punches.enableAll();

  /**
   * Get active user
   */
  addon.port.emit("GetActiveUser");

  /**
   * Callback method, when active user is loaded.
   */
  addon.port.on("ActiveUserLoaded", function(user) {
    if (user != null) {
      // Set user to model
      viewModel.user(new User(JSON.parse(user)));

      // Load all user goals
      loadGoals(viewModel.user());
    }
  });

  // Apply view model

  ko.applyBindings(viewModel);
});
