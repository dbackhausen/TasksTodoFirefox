$(document).ready(function() {

  $("#login-form button").html(i18n.t('login.btn-login'));
  $("#register-form button").html(i18n.t('login.btn-register'));
  $("#forgot-password-form button").html(i18n.t('general.btn-submit'));

  $(".modal-footer button").html(i18n.t('general.btn-close'));

  /////////////////////////////////////////////////////////////////////////////
  // ERROR HANDLING                                                          //
  /////////////////////////////////////////////////////////////////////////////
  
  addon.port.on("Error", function(error) {
    if (error != null && error.length > 0) {
      showErrorMessage(error, '#error');
    }
  });

  /////////////////////////////////////////////////////////////////////////////
  // VIEW MODEL                                                              //
  /////////////////////////////////////////////////////////////////////////////
  function ViewModel() {
    var self = this;
  
    self.user = ko.observable();

    /**
     * Login user.
     */
    self.login = function(data) {
      var username = $("#login-username").val();
      var password = $("#login-password").val();

      loginUser(new User({
        "username" : username.toLowerCase(),
        "password" : password
      }));
    };

    /**
     * Register new user.
     */
    self.register = function(data) {
      var username = $("#register-username").val();
      var password = $("#register-password").val();

      if (validateEmail(username.toLowerCase())) {
        if (password != null && password.length > 0) {
          registerUser(new User({
            "username" : username.toLowerCase(),
            "password" : password
          }));       
        } else {
          showErrorMessage(i18n.t("login.alert-valid-password"), '#modal-panel-register .dialog-alert');
        }
      } else {
        showErrorMessage(i18n.t("login.alert-valid-username"), '#modal-panel-register .dialog-alert');
      }
    };

    /**
     * Reset user password
     */
    self.sendPassword = function(data) {
      var username = $("#forgot-password-username").val();
      
      if (validateEmail(username.toLowerCase())) {
        sendPassword(username);
      } else {
        showErrorMessage(i18n.t("login.alert-invalid-username"), '#modal-panel-forgot-password .dialog-alert');
      }
    };
  };

  // Apply view model
  var viewModel = new ViewModel();
  ko.applyBindings(viewModel);

  /**
   * Log in user.
   */
  function loginUser(user) {
    addon.port.emit("LoginUser", ko.toJSON(user));
  }

  addon.port.on("UserLoggedIn", function(user) {
    if (user) {
      // Set the current user
      addon.port.emit("SetActiveUser", user);

      // Redirect to goals page
      addon.port.emit("Redirect", "goals.html");
    }
  });

  /**
   * Register user.
   */
  function registerUser(user) {
    addon.port.emit("RegisterUser", ko.toJSON(user));
  }

  addon.port.on("UserRegistered", function(user) {
    $("#register-username").val(null);
    $("#register-password").val(null);
    showSuccessMessage(i18n.t("login.success-register"), '#modal-panel-register .dialog-alert');
  });
  
  addon.port.on("UserAlreadyExists", function(user) {
    $("#register-username").val(null);
    $("#register-password").val(null);
    showErrorMessage(i18n.t("login.alert-user-exits"), '#modal-panel-register .dialog-alert');
  });

  /**
   * Forgot password.
   */
  function sendPassword(username) {
    addon.port.emit("SendPassword", username);
    showSuccessMessage(i18n.t("login.success-password-sent"), '#modal-panel-forgot-password .dialog-alert');
  }

  addon.port.on("PasswordReset", function(user) {
    $("#register-username").val(null);
  });
});
