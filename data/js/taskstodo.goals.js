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

      // Load all user goals
      loadGoals(activeUser);
    }
  });

  /****************************************************************************
   * GOAL MODEL
   ****************************************************************************/
  function GoalModel() {
    var self = this;
    
    self.selectedGoal = ko.observable();
    self.goals = ko.observableArray();
    
    self.selectGoal = function(goal) {
      self.selectedGoal(goal);
      selectGoal(goal);
    };
    
    self.newGoal = function() {
      self.selectedGoal = ko.observable();
      $("#goal-form-input-title").val(null);
      $("#goal-form-input-description").val(null);
      $('#goal-form').show("fast");
    };
    
    self.editGoal = function(goal) {
      self.selectedGoal = goal;
      $("#goal-form-input-title").val(self.selectedGoal.title);
      $("#goal-form-input-description").val(self.selectedGoal.description);
      $('#goal-form').show("fast");
    };
    
    self.cancelGoalForm = function() {
      self.selectedGoal = ko.observable();
      $('#goal-form').hide();
      $("#goal-form-input-title").val(null);
      $("#goal-form-input-description").val(null);
    };

    self.saveGoal = function() {
      var title = $("#goal-form-input-title").val();
      var description = $('#goal-form-input-description').val();
 
      if (title != null && title.length > 0) {
        if (self.selectedGoal != null && self.selectedGoal.id != null) {
          // Update goal
          var json = { 
            "id" : self.selectedGoal.idAsString,
            "userId" : activeUser.idAsString,
            "title" : title,
            "description" : description
          };

          updateGoal(json);
        } else {
          // Add new goal
          var json = { 
            "userId" : activeUser.idAsString,
            "title" : title,
            "description" : description
          };

          addGoal(json);
        }

        self.cancelGoalForm();
      }
    }

    self.deleteGoal = function(goal) {
      deleteGoal(goal);
    };

    self.finishGoal = function(goal) {
      alert("FINISHED!");
    };
  };
  
  // Apply view model
  var goalModel = new GoalModel();
  ko.applyBindings(goalModel, document.getElementById("content"));

  /**
   * Loads all gaols.
   */
  function loadGoals(user) {
    console.log("Loading tasks for user " + user.username);
    addon.port.emit("LoadGoals", user);
  }

  addon.port.on("GoalsLoaded", function(goals) {
    goalModel.goals.removeAll();
    ko.utils.arrayForEach(goals, function(goal) {
      goalModel.goals.push(goal);
    });
  });
  
  /**
   * Adds a new goal.
   */
  function addGoal(goal) {
    addon.port.emit("AddGoal", goal);
  }

  addon.port.on("GoalAdded", function(data) {
    // load all gaols
    loadGoals(activeUser);
  });

 /**
   * Saves changes to an existing goal.
   */
  function updateGoal(goal) {
    addon.port.emit("UpdateGoal", goal);
  }

  addon.port.on("GoalUpdated", function(data) {
    console.log("Goal updated");

    // load all gaols
    loadGoals(activeUser);
  });
  
  /**
   * Deletes an existing goal.
   */
  function deleteGoal(goal) {
    addon.port.emit("DeleteGoal", goal);
  }

  addon.port.on("GoalDeleted", function(data) {
    console.log("Goal deleted");

    // load all gaols
    loadGoals(activeUser);
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
