var jQuery = jQuery || {};

var MotifSpeedWriter = (function(my, $) {
  'use strict';

  my.resetForm = function() {
    my.motifTextField.val('');
    my.generateMotif();
  };

  my.handleAutoTextEntry = function(key) {
    // Handle Motif staff entry
    var val = my.motifTextField.val();
    var cursorPos = my.motifTextField.caret();
    var numDoubleBars = (val.match(/\|\|/g) || []).length;
    var posDoubleBar = val.indexOf('||');
    var verticalBarAscii = 220;
    var leftParenAscii = 57;
    // If entered the second bar of two-bar series and there are no other double bars in the text
    if (key === verticalBarAscii && numDoubleBars === 1 && (cursorPos === posDoubleBar + 1 || cursorPos === posDoubleBar + 2)) {
      // Only add one bar if for some reason there's a solo bar at the end
      var stringToAdd = (posDoubleBar != val.length - 2 && val.charAt(val.length - 1) === '|') ? '|' : ' ||';
      my.motifTextField.val(val + stringToAdd);
      my.motifTextField.caret(cursorPos);
      if (my.motifTextField.val().charAt(cursorPos) !== '|') {
        my.motifTextField.caret(' ');
      }
    // Else if entered left paren, then auto-add right paren
    } else if (key === leftParenAscii) {
      my.motifTextField.caret(')');
      my.motifTextField.caret(cursorPos);
    }
  };

  my.generateMotif = function() {
    var parsedMotif = my.parseMotif(my.motifTextField.val());
    my.drawMotif(parsedMotif);
    my.generateMotifImage();
  };

  my.pushHistory = function(motifText, locationPathname) {
    var motifParam = motifText ? '?motif=' + encodeURIComponent(motifText) : '';
    window.history.pushState(null, 'Motif SpeedWriter | Laban Labs', locationPathname + motifParam);
  };

  my.loadExistingMotif = function(locationSearch) {
    var match = locationSearch.match(/motif=([^&]*)/);
    if (match) {
      var motifText = decodeURIComponent(match[1] + ''); // Converts to string if empty
      my.motifTextField.val(motifText);
      my.motifTextField.focus();
      my.generateMotif();
    } else {
      my.resetForm();
    }
  };

  my.generateMotifImage = function() {
    var canvasDataURL = my.motifCanvas[0].toDataURL('image/png');
    my.motifImageContainer.html('<img src="' + canvasDataURL + '">');
  };

  return my;

})(MotifSpeedWriter || {}, jQuery);
