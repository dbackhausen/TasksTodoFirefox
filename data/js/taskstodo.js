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


  /////////////////////////////////////////////////////////////////////////////
  // ERROR HANDLING                                                          //
  /////////////////////////////////////////////////////////////////////////////
  
  addon.port.on("Error", function(error) {
    console.error("[ERROR] " + error);
  });
});


function validateEmail(email) { 
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

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
// MODEL CLASSES                                                           //
/////////////////////////////////////////////////////////////////////////////  

function User(data) {
  this.id = data.id;
  this.username = ko.observable(data.username);
  this.password = ko.observable(data.password);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
}

function Goal(data) {
  this.id = data.id;
  this.title = ko.observable(data.title);
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
  this.id = data.id;
  this.title = ko.observable(data.title);
  this.description = ko.observable(data.description);
  this.goalId = ko.observable(data.goalId);
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

function Note(data) {
  this.id = data.id;
  this.taskId = ko.observable(data.taskId);
  this.body = ko.observable(data.body);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
  this.deleted = ko.observable(data.deleted);
}

function Bookmark(data) {
  this.id = data.id;
  this.taskId = ko.observable(data.taskId);
  this.title = ko.observable(data.title);
  this.url = ko.observable(data.url);
  this.description = ko.observable(data.description);
  this.thumbnail = ko.observable(data.thumbnail);
  this.content = ko.observable(data.content);
  this.relevance = ko.observable(data.relevance);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
  this.deleted = ko.observable(data.deleted);
}

function HistoryEntry(data) {
  this.id = data.id;
  this.taskId = ko.observable(data.taskId);
  this.title = ko.observable(data.title);
  this.url = ko.observable(data.url);
  this.description = ko.observable(data.description);
  this.thumbnail = ko.observable(data.thumbnail);
  this.content = ko.observable(data.content);
  this.relevance = ko.observable(data.relevance);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
  this.deleted = ko.observable(data.deleted);
}

function Attachment(data) {
  this.id = data.id;
  this.taskId = data.taskId;
  this.filename = data.filename;
  this.size = data.size;
  this.contentType = data.contentType;
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
  this.deleted = ko.observable(data.deleted);
}

function Tab(data) {
  this.id = data.id;
  this.taskId = ko.observable(data.taskId);
  this.title = ko.observable(data.title);
  this.url = ko.observable(data.url);
  this.description = ko.observable(data.description);
  this.thumbnail = ko.observable(data.thumbnail);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
  this.deleted = ko.observable(data.deleted);
}
