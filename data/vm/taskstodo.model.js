
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
  this.dueDate = ko.observable(data.dueDate);
  this.priority = ko.observable(data.priority);
  this.position = ko.observable(data.position);
  this.level = ko.observable(data.level);
  this.completed = ko.observable(data.completed);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
}

function Task(data) {
  this._id = data._id;
  this.title = ko.protectedObservable(data.title);
  this.goal = ko.observable(data.goal);
  this.priority = ko.observable(data.priority);
  this.position = ko.observable(data.position);
  this.level = ko.observable(data.level);
  this.completed = ko.observable(data.completed);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
}

function Note(data) {
  this._id = data._id;
  this.goal = data.goal ? ko.observable(data.goal) : null;
  this.task = data.task ? ko.observable(data.task) : null;
  this.body = ko.protectedObservable(data.body);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
}

function Bookmark(data) {
  this._id = data._id;
  this.task = ko.observable(data.task);
  this.title = ko.protectedObservable(data.title);
  this.url = ko.protectedObservable(data.url);
  this.description = ko.protectedObservable(data.description);
  this.thumbnail = ko.observable(data.thumbnail);
  this.content = ko.observable(data.content);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
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
}

function Query(data) {
  this._id = data._id;

  for (i = 0; i < data.parameters.length; i++) {
    var parameter = data.parameters[i];

    if (parameter.key == "taskId") {
      this.taskId = ko.observable(parameter.value);
    } else if (parameter.key == "provider") {
      this.provider = ko.observable(parameter.value);
    } else if (parameter.key == "query") {
      this.query = ko.observable(parameter.value);
    } else if (parameter.key == "url") {
      this.url = ko.observable(parameter.value);
    }
  }

  this.created = ko.observable(data.created);
}

function Screenshot(data) {
  this._id = data._id;
  this.taskId = ko.observable(data.taskId);
  this.image = ko.observable(data.image);
  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
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

  for (i = 0; i < data.parameters.length; i++) {
    var parameter = data.parameters[i];

    if (parameter.key == "taskId") {
      this.taskId = ko.observable(parameter.value);
    } else if (parameter.key == "tabUrl") {
      this.url = ko.observable(parameter.value);
    } else if (parameter.key == "tabTitle") {
      this.title = ko.observable(parameter.value);
    } else if (parameter.key == "tabThumbnail") {
      this.thumbnail = ko.observable(parameter.value);
    } else if (parameter.key == "tabIndex") {
      this.index = ko.observable(parameter.value);
    } else if (parameter.key == "tabPinned") {
      this.pinned = ko.observable(parameter.value);
    }
  }

  this.created = ko.observable(data.created);
  this.modified = ko.observable(data.modified);
  this.deleted = ko.observable(data.deleted);
}

function LogEntry(data) {
  this._id = data._id;
  this.action = data.action;
  this.parameters = data.parameters;
  this.created = data.created;
}
