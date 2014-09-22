self.port.on("getElements", function(tag) {
  var elements = document.getElementsByTagName(tag);
  for (var i = 0; i < elements.length; i++) {
    self.port.emit("gotElement", elements[i].innerHTML);
  }
});

// $(document).ready(function () {
// //    $(document).ajaxComplete(function() {
//       console.log($(location).attr('href'));
//       console.log(window.location.href);
// //    });
// });

// $(document).ajaxComplete(function(event, request, settings) {
// 	console.log($(location).attr('href'));
// });