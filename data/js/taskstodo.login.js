$(document).ready(function() {
  /////////////////////////////////////////////////////////////////////////////
  // ERROR HANDLING                                                          //
  /////////////////////////////////////////////////////////////////////////////
  
  addon.port.on("Error", function(error) {
    if (error != null && error.length > 0) {
      $('<div class="alert alert-danger" role="alert">'+error+'</div>').insertAfter('.inline-content h1').delay(3000).fadeOut(1000);
    }
  });

  /////////////////////////////////////////////////////////////////////////////
  // VIEW MODEL                                                              //
  /////////////////////////////////////////////////////////////////////////////
  function ViewModel() {
    var self = this;
  
    self.user = ko.observable();

    self.login = function(data) {
      var json = { 
        "username" : $("#login-username").val(),
        "password" : $("#login-password").val()
      };
      loginUser(JSON.stringify(json));
    };
    
  };

  // Apply view model
  var viewModel = new ViewModel();
  ko.applyBindings(viewModel);

  /**
   * Log in user.
   */
  function loginUser(user) {
    addon.port.emit("LoginUser", user);
  }

  addon.port.on("UserLoggedIn", function(user) {
    if (user != null) {
      // Set the current user
      addon.port.emit("SetActiveUser", user);

      // Redirect to goals page
      addon.port.emit("Redirect", "goals.html");
    }
  })
});
