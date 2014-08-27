$(document).ready(function() { 
  // Enable flexible textareas
  $('.flexible').autosize();

  // Datepicker options (see: http://eternicode.github.io/bootstrap-datepicker)
  $('.datepicker').datepicker({
    autoclose: true,
    todayHighlight: true
  });

  $('#button').click(function() { 
    $('#content').animate({ left: 250 }, 'slow', function() { });  
  });

  $('#content').click(function() { 
    //$('#content').animate({ left: 0 }, 'slow', function() { });      
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
