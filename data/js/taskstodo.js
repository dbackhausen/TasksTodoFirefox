$(document).ready(function() { 
  // Enable flexible textareas
  $('.flexible').autosize();

  // Datepicker options (see: http://eternicode.github.io/bootstrap-datepicker)
  $('.datepicker').datepicker({
    autoclose: true,
    todayHighlight: true
  });

  $('#open-top-menu-button').click(function() { 
    $('#content').animate({ left: 350 }, 'slow', function() { });  
  });

  $('#close-top-menu-button').click(function() { 
    $('#content').animate({ left: 0 }, 'slow', function() { });  
  });

  /////////////////////////////////////////////////////////////////////////////
  // FUNCTIONS                                                               //
  /////////////////////////////////////////////////////////////////////////////
  
  ko.filters.redirect = function(page) {
    // Redirect to tasks page
    addon.port.emit("Redirect", page);
  }

  /////////////////////////////////////////////////////////////////////////////
  // FILTERS                                                                 //
  /////////////////////////////////////////////////////////////////////////////
  
  ko.filters.smartdate = function(date) {
    return moment(date).format("YYYY-MM-DD HH:mm");
  };
});


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
  this.urgency = ko.observable(data.urgency);
  this.priority = ko.observable(data.priority);
  this.level = ko.observable(data.level);
  this.position = ko.observable(data.position);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
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
}

function Note(data) {
  this.id = data.id;
  this.taskId = ko.observable(data.taskId);
  this.body = ko.observable(data.body);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
}

function Bookmark(data) {
  this.id = data.id;
  this.taskId = ko.observable(data.taskId);
  this.title = ko.observable(data.title);
  this.url = ko.observable(data.url);
  this.description = ko.observable(data.description);
  this.thumbnail = ko.observable(data.thumbnail);
  this.relevance = ko.observable(data.relevance);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
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
}
