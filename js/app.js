$(document).ready(function() {
  $('#motif-text-clear-button').click(function(event) {
    $('#motif-text').val('');
    event.preventDefault();
  });
});