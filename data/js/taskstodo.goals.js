$(document).ready(function() {

  ko.punches.enableAll();
  
  var activeUser;

  /**
   * Get active user
   */
   addon.port.emit("GetActiveUser");

   addon.port.on("ActiveUserLoaded", function(user) {
    if (user != null) {
      // Set active user
      activeUser = user;
      viewModel.user(activeUser);

      // Load all user goals
      loadGoals(activeUser);

      // Load all completed goals
      loadCompletedGoals(activeUser);
    }
  });

  function ViewModel() {
    var self = this;
    
    self.user = ko.observable();
    self.selectedGoal = ko.observable();
    self.goals = ko.observableArray();
    self.completedGoals = ko.observableArray();

    self.selectGoal = function(goal) {
      self.selectedGoal = goal;
      selectGoal(goal);
    };
    
    self.newGoal = function() {
      self.selectedGoal = ko.observable();
      
      $('#new-goal-form-button-new').hide();
      $('#new-goal-form:visible').hide();

      $('#new-goal-form-input-title').val(null);
      $('#new-goal-form').show('fast');
      $('#new-task-form-input-title').focus();
      
      // Reset width and height
      $('#new-goal-form-input-title').css({"width":"", "height":"", "top": "", "left" : ""});
    };
    
    self.cancelNewGoal = function() {
      self.selectedGoal = ko.observable();

      $("#new-goal-form").hide();
      $("#new-goal-form-input-title").val(null);

      $('#new-goal-form-button-new').show();
    };
    
    self.editGoal = function(goal) {
      $('#new-goal-form-button-new').hide(); // hide new button
      $('#new-goal-form:visible').hide(); // hide new goal form

      $('#tt-goal-list').find('.tt-inline-edit:visible').hide();
      $('#'+goal.id).find('.tt-entry').hide();

      $('#'+goal.id+' #edit-task-form-input-title').val(goal.title());
      $('#'+goal.id+' .tt-inline-edit').fadeIn('fast');
      
      $('#edit-goal-form-input-title').height($('#edit-goal-form-input-title').prop('scrollHeight'));
    };
    
    self.cancelEditGoal = function(goal) {
      $('#new-goal-form-button-new').show();
      $('#'+goal.id).find('.tt-entry').show();

      $('#'+goal.id+' .tt-inline-edit').hide();
      $('#'+goal.id+' #edit-goal-form-input-title').val(null);
    };

    self.addGoal = function() {
      var title = $("#new-goal-form-input-title").val();
      
      if (title != null && title.length > 0) {
        addGoal({ 
          "userId" : activeUser.id,
          "title" : title,
          "description" : "",
          "position" : self.goals().length > 0 ? (self.goals().length + 1) : 1,
          "level" : 0,
          "urgency" : 0,
          "priority" : 0,
          "created" : new Date(),
          "modified" : new Date()
        });
      }

      self.cancelNewGoal();
    }

    self.updateGoal = function(goal) {
      var title = $('#'+goal.id+' #edit-goal-form-input-title').val();

      if (title != null && title.length > 0) {
        goal.title(title);
        updateGoal(goal);
      }

      self.cancelEditGoal(goal);
    }

    self.deleteGoal = function(goal) {
      deleteGoal(goal);
    };

    self.completeGoal = function(goal) {
      if (goal.completed()) {
        goal.completed(false);
        goal.completedDate(null);
        updateGoal(goal);
        self.goals.push(goal);
        self.completedGoals.remove(goal);
      } else {
        goal.completed(true);
        goal.completedDate(new Date());
        updateGoal(goal);
        self.goals.remove(goal);
        self.completedGoals.push(goal);
      }
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
            arg.item.parentId(self.goals()[arg.targetIndex - 1].id);
          }
        }

        updateGoal(arg.item);

        // If goal position has been modified
        ko.utils.arrayForEach(self.goals(), function(goal) {
          // console.log(self.tasks.indexOf(goal) + ": " + goal.title);
          if (goal.id != arg.item.id) {
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
    }
  }

  // Apply view model
  var viewModel = new ViewModel();
  ko.applyBindings(viewModel);

  /**
   * Loads all gaols.
   */
  function loadGoals(user) {
    addon.port.emit("LoadGoals", user);
  }

  addon.port.on("GoalsLoaded", function(goals) {
    viewModel.goals.removeAll();
    ko.utils.arrayForEach(goals, function(goal) {
      viewModel.goals.push(new Goal(goal));
    });
  });

  /**
   * Loads all completed gaols.
   */
  function loadCompletedGoals(user) {
    addon.port.emit("LoadCompletedGoals", user);
  }

  addon.port.on("CompletedGoalsLoaded", function(goals) {
    viewModel.completedGoals.removeAll();
    ko.utils.arrayForEach(goals, function(goal) {
      viewModel.completedGoals.push(new Goal(goal));
    });
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
    goal.modified(new Date());
    addon.port.emit("UpdateGoal", ko.toJSON(goal));
  }

  addon.port.on("GoalUpdated", function(data) {
  });
  
  /**
   * Deletes an existing goal.
   */
  function deleteGoal(goal) {
    // addon.port.emit("DeleteGoal", goal);
    goal.deleted(true);
    goal.position(-1);
    goal.parentId(null);
    goal.level(0);
    updateGoal(goal);
    viewModel.goals.remove(goal);
  }

  addon.port.on("GoalDeleted", function(data) {
  });

  /**
   * Selects a goal.
   */
  function selectGoal(goal) {
    // trigger goal selection to addon script      
    addon.port.emit("SetActiveGoal", ko.toJS(goal));

    // Redirect to tasks page
    addon.port.emit("Redirect", "tasks.html");
  }
});
