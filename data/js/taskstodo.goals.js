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
    }
  });

  function ViewModel() {
    var self = this;
    
    self.user = ko.observable();
    self.selectedGoal = ko.observable();
    self.goals = ko.observableArray();
    
    self.selectGoal = function(goal) {
      self.selectedGoal(goal);
      selectGoal(goal);
    };
    
    self.newGoal = function() {
      self.selectedGoal = ko.observable();
      $("#new-goal-form-input-title").val(null);
      $("#new-goal-form").show("fast");
    };
    
    self.cancelNewGoal = function() {
      self.selectedGoal = ko.observable();
      $("#new-goal-form").hide();
      $("#new-goal-form-input-title").val(null);
    };
    
    self.editGoal = function(goal) {
      $('#new-goal-form-button-new').hide();
      $('#new-goal-form:visible').hide();

      $('.goal-list-entry').find('.inline-edit:visible').hide();
      $('#'+goal.id).find('.goal-list-entry').hide();
console.log($('#'+goal.id).html());
      $('#'+goal.id+' #edit-goal-form-input-title').val(goal.title());
      $('#'+goal.id+' .inline-edit').fadeIn('fast');
    };
    
    self.cancelEditGoal = function(goal) {
      $('#new-goal-form-button-new').show();
      $('#'+goal.id).find('.goal-list-entry').show();
      $('#'+goal.id+' .inline-edit').hide();
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
        goal.modified(new Date());
        updateGoal(goal);
      }

      self.cancelEditGoal(goal);
    }

    self.deleteGoal = function(goal) {
      deleteGoal(goal);
    };

    self.completeGoal = function(goal) {
      // TODO
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
    addon.port.emit("UpdateGoal", ko.toJSON(goal));
  }

  addon.port.on("GoalUpdated", function(data) {
  });
  
  /**
   * Deletes an existing goal.
   */
  function deleteGoal(goal) {
    addon.port.emit("DeleteGoal", goal);
  }

  addon.port.on("GoalDeleted", function(data) {
  });

  /**
   * Selects a goal.
   */
  function selectGoal(goal) {
    // trigger goal selection to addon script      
    addon.port.emit("SetActiveGoal", goal);

    // Redirect to tasks page
    addon.port.emit("Redirect", "tasks.html");
  }
});
