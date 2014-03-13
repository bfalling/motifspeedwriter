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

      // Handle Motif staff entry
      var cursorPos = $this.caret();
      var numDoubleBars = (val.match(/\|\|/g) || []).length;
      var posDoubleBar = val.indexOf('||');
      // If entered the second bar of two-bar series and there are no other double bars in the text
      if (event.which === 220 && numDoubleBars === 1 && (cursorPos === posDoubleBar + 1 || cursorPos === posDoubleBar + 2)) {
        // Only add one bar if for some reason there's a solo bar at the end
        var stringToAdd = (posDoubleBar != val.length - 2 && val.charAt(val.length - 1) === '|') ? '|' : ' ||';
        $this.val($this.val() + stringToAdd);
        $this.caret(cursorPos);
        if ($this.val().charAt(cursorPos) !== '|') {
          $this.caret(' ');
        }
      } else if (event.which === 57) {
        // Left paren auto-adds right paren
        $this.caret(')');
        $this.caret(cursorPos);
      }

      MotifSpeedWriter.generateMotif($this.val());

      // Push new state to browser URL
      var motifParam = $this.val() ? '?motif=' + encodeURIComponent($this.val()) : '';
      window.history.pushState(null, 'Motif SpeedWriter | Laban Labs', location.pathname + motifParam);
    });

    $(window).bind("popstate", function() {
        MotifSpeedWriter.loadPage();
    });

    MotifSpeedWriter.loadPage();
  });

  $(document).foundation();

})(jQuery);
