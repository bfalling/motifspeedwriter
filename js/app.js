var MotifSpeedWriter = MotifSpeedWriter || {};
var jQuery = jQuery || {};

jQuery.noConflict();

(function($) {
  'use strict';

  $(document).ready(function() {
    $('#motif-text-clear-button').click(function(event) {
      $('#motif-text').val('');
      MotifSpeedWriter.generateMotif('');
      $('#motif-text').focus();
      event.preventDefault();
    });

    // keyup fires multiple events, so just catch and process first one
    $('#motif-text').keyup(function(event) {
      var $this = $(this);
      var val = $this.val();

      handleAutoTextEntry(event.which, $this);
      MotifSpeedWriter.generateMotif($this.val());
      pushHistory($this.val());
    });

    $(window).bind("popstate", function() {
        MotifSpeedWriter.loadPage();
    });

    MotifSpeedWriter.loadPage();
  });

  $(document).foundation();

  var handleAutoTextEntry = function(key, textField) {
    // Handle Motif staff entry
    var val = textField.val();
    var cursorPos = textField.caret();
    var numDoubleBars = (val.match(/\|\|/g) || []).length;
    var posDoubleBar = val.indexOf('||');
    var verticalBarAscii = 220;
    var leftParenAscii = 57;
    // If entered the second bar of two-bar series and there are no other double bars in the text
    if (key === verticalBarAscii && numDoubleBars === 1 && (cursorPos === posDoubleBar + 1 || cursorPos === posDoubleBar + 2)) {
      // Only add one bar if for some reason there's a solo bar at the end
      var stringToAdd = (posDoubleBar != val.length - 2 && val.charAt(val.length - 1) === '|') ? '|' : ' ||';
      textField.val(textField.val() + stringToAdd);
      textField.caret(cursorPos);
      if (textField.val().charAt(cursorPos) !== '|') {
        textField.caret(' ');
      }
    // Else if entered left paren, then auto-add right paren
    } else if (key === leftParenAscii) {
      textField.caret(')');
      textField.caret(cursorPos);
    }
  };

  var pushHistory = function(motifText) {
    var motifParam = motifText ? '?motif=' + encodeURIComponent(motifText) : '';
    window.history.pushState(null, 'Motif SpeedWriter | Laban Labs', location.pathname + motifParam);
  };

})(jQuery);
