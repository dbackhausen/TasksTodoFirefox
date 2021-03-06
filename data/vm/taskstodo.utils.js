
/////////////////////////////////////////////////////////////////////////////
// I18N                                                                    //
/////////////////////////////////////////////////////////////////////////////

i18n.init({
  lng: "en-US",
  debug: true
}, function () {
  ko.bindingHandlers.i18n = {
    update: function(element, valueAccessor, allBindings){
      var key = ko.unwrap(valueAccessor());
      var options = ko.toJS(allBindings.get('i18n-options') || {});
      var translation = i18n.t(key);
      element.innerHTML = translation;
    }
  };
});


/////////////////////////////////////////////////////////////////////////////
// TOP MENU                                                                //
/////////////////////////////////////////////////////////////////////////////

showHelp = function() {
  addon.port.emit("ShowHelp");
};

showGoals = function() {
  $('#content').animate({ left: 0 }, 'slow', function() {
    addon.port.emit("Redirect", "goals.html");
  });
};

$(document).ready(function() {

  /////////////////////////////////////////////////////////////////////////////
  // TASKSTODO EVENT TRACKING                                                //
  /////////////////////////////////////////////////////////////////////////////

  $(document).bind("click dblclick select submit", function(event) {
    addon.port.emit("TrackEvent", event.type, event.target.id);
  });

  /////////////////////////////////////////////////////////////////////////////
  // TOP MENU                                                                //
  /////////////////////////////////////////////////////////////////////////////

  $('#top-menu-toggle-button').click(function() {
    if ($('#content').css('left') == '350px') {
      $('#content').animate({ left: 0 }, 'slow', function() { });
    } else {
      $('#content').animate({ left: 350 }, 'slow', function() { });
    }
  });

  /////////////////////////////////////////////////////////////////////////////
  // TEMPLATING                                                              //
  /////////////////////////////////////////////////////////////////////////////

  infuser.defaults.templateSuffix = ".tmpl.html";
  infuser.defaults.templateUrl = "templates";

  /////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS                                                               //
  /////////////////////////////////////////////////////////////////////////////

  ko.filters.redirect = function(page) {
    // Redirect to tasks page
    addon.port.emit("Redirect", page);
  }

  // Enable flexible textareas
  $('.flexible').autosize();

  // KO handler for autosize
  ko.bindingHandlers.koAutoresize = {
    update: function(element, valueAccessor) {
      var options = ko.utils.unwrapObservable(valueAccessor()) || {};
      $(element).autosize();
    }
  };

  // Datepicker options (see: http://eternicode.github.io/bootstrap-datepicker)
  $('.datepicker').datepicker({
    autoclose: true,
    todayHighlight: true
  });

  /////////////////////////////////////////////////////////////////////////////
  // FILTERS                                                                 //
  /////////////////////////////////////////////////////////////////////////////

  ko.filters.smartdate = function(date) {
    return moment(date).format("YYYY-MM-DD HH:mm");
  };

  ko.filters.smartsize = function(bytes) {
    if (bytes == 0) return '0 Byte';
    var k = 1000;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
  };

  ko.filters.limit100 = function(string) {
    var maxSize = 100;

    if (string && string.length > maxSize) {
      return string.substring(0, maxSize-4) +  " ..."
    }

    return string;
  };

  ko.filters.filterTopLevelDomain = function(url) {
    var maxSize = 30;

    if (url) {
      if (url.indexOf("://") > -1) {
        url = url.split('/')[2];
      } else {
        url = url.split('/')[0];
      }

      // find & remove port number
      url = url.split(':')[0];
      url = url.replace("www.", "");

      if (url.length > maxSize) {
        url = url.substring(0, maxSize-4) +  " ..."
      }

      return url;
    }

    return "";
  };

  ko.filters.smarttype = function(str) {
    if (str == "application/pdf") {
      return "PDF Document";
    } else if (str == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || str == "application/msword") {
      return "MS Word Document";
    } else if (str == "application/vnd.openxmlformats-officedocument.wordprocessingml.template") {
      return "MS Word Template";
    } else if (str == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || str == "application/msexcel") {
      return "MS Excel Spreadsheet";
    } else if (str == "application/vnd.openxmlformats-officedocument.spreadsheetml.template") {
      return "MS Excel Template";
    } else if (str == "application/vnd.ms-excel.addin.macroEnabled.12") {
      return "Macro-enabled MS Excel";
    } else if (str == "application/vnd.ms-excel.sheet.binary.macroEnabled.12") {
      return "Binary Macro-enabled MS Excel";
    } else if (str == "application/vnd.openxmlformats-officedocument.presentationml.slideshow") {
      return "MS PowerPoint Slideshow";
    } else if (str == "application/vnd.openxmlformats-officedocument.presentationml.presentation" || str == "application/mspowerpoint") {
      return "MS PowerPoint Presentation";
    } else if (str == "application/vnd.openxmlformats-officedocument.presentationml.template") {
      return "MS PowerPoint Template";
    } else if (str == "application/vnd.openxmlformats-officedocument.presentationml.slide") {
      return "MS PowerPoint Slide";
    } else {
      return str;
    }
  };

  /*
   * Wrapper to an observable that requires accept/cancel
   * (see http://www.knockmeout.net/2011/03/guard-your-model-accept-or-cancel-edits.html)
   */
  ko.protectedObservable = function(initialValue) {
    //private variables
    var _actualValue = ko.observable(initialValue),
        _tempValue = initialValue;

    //computed observable that we will return
    var result = ko.computed({
      //always return the actual value
      read: function() {
        return _actualValue();
      },
      //stored in a temporary spot until commit
      write: function(newValue) {
        _tempValue = newValue;
      }
    }).extend({ notify: "always" });

    //if different, commit temp value
    result.commit = function() {
      if (_tempValue !== _actualValue()) {
        _actualValue(_tempValue);
      }
    };

    //force subscribers to take original
    result.reset = function() {
      _actualValue.valueHasMutated();
      _tempValue = _actualValue();   //reset temp value
    };

    return result;
  };

  /////////////////////////////////////////////////////////////////////////////
  // ERROR HANDLING                                                          //
  /////////////////////////////////////////////////////////////////////////////

  addon.port.on("Error", function(error) {
    console.error("[ERROR] " + error);
  });
});

/////////////////////////////////////////////////////////////////////////////
// INPUT VALIDATION                                                        //
/////////////////////////////////////////////////////////////////////////////

function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

/////////////////////////////////////////////////////////////////////////////
// USER NOTIFICATIONS                                                      //
/////////////////////////////////////////////////////////////////////////////

function showSuccessMessage(message, location) {
  $('<div class="alert alert-success" role="alert">'+message+'</div>').appendTo(location).delay(3000).fadeOut(1000);
}

function showWarningMessage(message, location) {
  $('<div class="alert alert-warning" role="alert">'+message+'</div>').appendTo(location).delay(3000).fadeOut(1000);
}

function showInfoMessage(message, location) {
  $('<div class="alert alert-info" role="alert">'+message+'</div>').appendTo(location).delay(3000).fadeOut(1000);
}

function showErrorMessage(message, location) {
  $('<div class="alert alert-danger" role="alert">'+message+'</div>').appendTo(location).delay(3000).fadeOut(1000);
}

/////////////////////////////////////////////////////////////////////////////
// LOGGING                                                                 //
/////////////////////////////////////////////////////////////////////////////

function loadLogEntries(user) {
  addon.port.emit("LoadLogEntries", user._id);
}

function addLogEntry(userId, action, paramters) {
  addon.port.emit("AddLogEntry",
    {
      "userId": userId,
      "action": action,
      "paramters": paramters
    }
  );
}
