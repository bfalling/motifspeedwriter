var jQuery = jQuery || {};
jQuery.noConflict();

var MotifSpeedWriter = (function(my, $) {
  'use strict';

  my.motifTextField = $('#motif-text');
  my.motifImageContainer = $('#motif-image-container');
  my.motifTextFieldClearButton = $('#motif-text-clear-button');
  my.motifCanvas = $('#motif-canvas');

  $(document).ready(function() {
    my.motifTextFieldClearButton.click(function(event) {
      my.resetForm();
      my.motifTextField.focus();
      event.preventDefault();
    });

    // keyup can fire multiple events, e.g. typing vertical bar (with shift)
    my.motifTextField.keyup(function(event) {
      my.handleAutoTextEntry(event.which);
      my.updateForMotifTextChange();
    });

    // Also catch mouse pasting (but doesn't identify keypresses)
    my.motifTextField.on('input', function() {
      my.updateForMotifTextChange();
    });

    $(window).bind("popstate", function() {
      my.loadExistingMotif(location.search);
    });

    my.loadExistingMotif(location.search);
  });

  $(document).foundation();

  return my;

})(MotifSpeedWriter || {}, jQuery);
