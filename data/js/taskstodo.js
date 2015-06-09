
/////////////////////////////////////////////////////////////////////////////
// I18N                                                                    //
/////////////////////////////////////////////////////////////////////////////

i18n.init({ 
  lng: "en-US", 
  /*useLocalStorage: true,
  localStorageExpirationTime: 86400000, // in ms, default 1 week = 86400000*/
  debug: true 
}, function () {
  ko.bindingHandlers.i18n = {
    update: function(element, valueAccessor, allBindings){
      var key = ko.unwrap(valueAccessor());
      var options = ko.toJS(allBindings.get('i18n-options') || {});
      var translation = i18n.t(key);
      //element.innerText = translation;
      element.innerHTML = translation;
    }
  };
});

$(document).ready(function() { 

  /////////////////////////////////////////////////////////////////////////////
  // TOP MENU                                                                //
  /////////////////////////////////////////////////////////////////////////////

  $('#top-menu-open-button').click(function() { 
    $('#content').animate({ left: 350 }, 'slow', function() { });  
  });

  $('#top-menu-close-button').click(function() { 
    $('#content').animate({ left: 0 }, 'slow', function() { });  
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

  ko.filters.smarttype = function(str) {
    if (str == "application/pdf") {
      return "PDF Document"
    } else if (str == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || str == "application/msword") {
      return "MS Word Document"
    } else if (str == "application/vnd.openxmlformats-officedocument.wordprocessingml.template") {
      return "MS Word Template"
    } else if (str == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || str == "application/msexcel") {
      return "MS Excel Spreadsheet"
    } else if (str == "application/vnd.openxmlformats-officedocument.spreadsheetml.template") {
      return "MS Excel Template"
    } else if (str == "application/vnd.ms-excel.addin.macroEnabled.12") {
      return "Macro-enabled MS Excel"
    } else if (str == "application/vnd.ms-excel.sheet.binary.macroEnabled.12") {
      return "Binary Macro-enabled MS Excel"
    } else if (str == "application/vnd.openxmlformats-officedocument.presentationml.slideshow") {
      return "MS PowerPoint Slideshow"
    } else if (str == "application/vnd.openxmlformats-officedocument.presentationml.presentation" || str == "application/mspowerpoint") {
      return "MS PowerPoint Presentation"
    } else if (str == "application/vnd.openxmlformats-officedocument.presentationml.template") {
      return "MS PowerPoint Template"
    } else if (str == "application/vnd.openxmlformats-officedocument.presentationml.slide") {
      return "MS PowerPoint Slide"
    } else {
      return "Unknown Binary Data File"
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

function showErrorMessage(message, location) {
  $('<div class="alert alert-danger" role="alert">'+message+'</div>').appendTo(location).delay(3000).fadeOut(1000);
}

/////////////////////////////////////////////////////////////////////////////
// LOGGING                                                                 //
/////////////////////////////////////////////////////////////////////////////

function loadLogEntries(user) {
  addon.port.emit("LoadLogEntries", user._id);  
}

function addLogEntry(userId, key, value) {
  addon.port.emit("AddLogEntry", 
    {
      "userId": userId,
      "key": key,
      "value": value
    }
  );
}

function updateLogEntry(entry) {
  
}

function deleteLogEntry(entry) {
  
}

/////////////////////////////////////////////////////////////////////////////
// MODEL CLASSES                                                           //
/////////////////////////////////////////////////////////////////////////////  

function User(data) {
  this._id = data._id;
  this.username = ko.protectedObservable(data.username);
  this.password = ko.protectedObservable(data.password);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
}

function Goal(data) {
  this._id = data._id;
  this.title = ko.protectedObservable(data.title);
  this.description = ko.observable(data.description);
  this.userId = ko.observable(data.userId);
  this.parentId = ko.observable(data.parentId);
  this.dueDate = ko.observable(data.dueDate);
  this.completedDate = ko.observable(data.completedDate);
  this.reminderDate = ko.observable(data.reminderDate);
  this.urgency = ko.observable(data.urgency);
  this.priority = ko.observable(data.priority);
  this.level = ko.observable(data.level);
  this.position = ko.observable(data.position);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
  this.completed = ko.observable(data.completed);
  this.deleted = ko.observable(data.deleted);
}

function Task(data) {
  this._id = data._id;
  this.title = ko.protectedObservable(data.title);
  this.description = ko.observable(data.description);
  this.goalId = ko.observable(data.goalId);
  this.parentId = ko.observable(data.parentId);
  this.dueDate = ko.observable(data.dueDate);
  this.reminderDate = ko.observable(data.reminderDate);
  this.urgency = ko.observable(data.urgency);
  this.priority = ko.observable(data.priority);
  this.level = ko.observable(data.level);
  this.position = ko.observable(data.position);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
  this.completed = ko.observable(data.completed);
  this.deleted = ko.observable(data.deleted);
}

function Note(data) {
  this._id = data._id;
  this.taskId = ko.observable(data.taskId);
  this.body = ko.protectedObservable(data.body);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
  this.deleted = ko.observable(data.deleted);
}

function Bookmark(data) {
  this._id = data._id;
  this.taskId = ko.observable(data.taskId);
  this.title = ko.protectedObservable(data.title);
  this.url = ko.protectedObservable(data.url);
  this.description = ko.protectedObservable(data.description);
  this.thumbnail = ko.observable(data.thumbnail);
  this.content = ko.observable(data.content);
  this.relevance = ko.observable(data.relevance);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
  this.deleted = ko.observable(data.deleted);
}

function HistoryEntry(data) {
  this._id = data._id;

  for (i = 0; i < data.parameters.length; i++) { 
    var parameter = data.parameters[i];

    if (parameter.key == "taskId") {
      this.taskId = ko.observable(parameter.value);
    } else if (parameter.key == "url") {
      this.url = ko.observable(parameter.value);
    } else if (parameter.key == "title") {
      this.title = ko.observable(parameter.value);
    } else if (parameter.key == "thumbnail") {
      this.thumbnail = ko.observable(parameter.value);
    } else if (parameter.key == "body") {
      this.body = ko.observable(parameter.value);
    }
  }
  
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
  this.deleted = ko.observable(data.deleted);
}

function Attachment(data) {
  this._id = data._id;
  this.taskId = data.metadata.taskId;
  this.filename = data.filename;
  this.length = data.length;
  this.contentType = data.contentType;
  this.uploadDate = data.uploadDate;
}

function Tab(data) {
  this._id = data._id;
  this.taskId = ko.observable(data.taskId);
  this.title = ko.observable(data.title);
  this.url = ko.observable(data.url);
  this.description = ko.observable(data.description);
  this.thumbnail = ko.observable(data.thumbnail);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
  this.deleted = ko.observable(data.deleted);
}
