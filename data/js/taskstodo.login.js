$(document).ready(function() {
  
  /**
   * USER MODEL
   */
  function UserModel() {
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
  var userModel = new UserModel();
  ko.applyBindings(userModel, document.getElementById("content"));

  /**
   * Log in user.
   */
  function loginUser(user) {
    addon.port.emit("LoginUser", user);
  }

  addon.port.on("UserLoggedIn", function(user) {
    if (user != null) {
      console.log(user.username + " successfully logged in");

      // Set the current user
      addon.port.emit("SetActiveUser", user);

      // Redirect to goals page
      addon.port.emit("Redirect", "goals.html");
    }
  })
});
