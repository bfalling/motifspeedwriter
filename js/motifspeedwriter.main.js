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

    // keyup fires multiple events, so just catch and process first one
    var lastMotifText;
    my.motifTextField.keyup(function(event) {
      my.handleAutoTextEntry(event.which);
      var motifText = my.motifTextField.val();
      if (motifText === lastMotifText) {
        return;
      } else {
        lastMotifText = motifText;
      }

      my.generateMotif();
      my.pushHistory(motifText, location.pathname);
    });

    $(window).bind("popstate", function() {
      my.loadExistingMotif(location.search);
    });

    my.loadExistingMotif(location.search);
  });

  $(document).foundation();

  return my;

})(MotifSpeedWriter || {}, jQuery);
