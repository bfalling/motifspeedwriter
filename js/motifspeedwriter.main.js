var jQuery = jQuery || {};
jQuery.noConflict();

var MotifSpeedWriter = (function(my, $) {
  'use strict';

  $(document).ready(function() {
    $('#motif-text-clear-button').click(function(event) {
      $('#motif-text').val('');
      my.generateMotif('');
      $('#motif-text').focus();
      event.preventDefault();
    });

    // keyup fires multiple events, so just catch and process first one
    $('#motif-text').keyup(function(event) {
      var $this = $(this);
      handleAutoTextEntry(event.which, $this);
      my.generateMotif($this.val());
      pushHistory($this.val());
    });

    $(window).bind("popstate", function() {
        my.loadPage();
    });

    my.loadPage();
  });

  $(document).foundation();

  my.loadPage = function() {
    var match = location.search.match(/motif=([^&]*)/);
    if (match) {
      var motifText = decodeURIComponent(match[1] + '');
      $('#motif-text').val(motifText);
      this.generateMotif(motifText);
      $('#motif-text').focus();
    } else {
      $('#motif-text-clear-button').click();
    }
  }; // loadPage

  var lastMotifText;
  my.generateMotif = function(motifText) {
    if (motifText === lastMotifText) {
      return;
    } else {
      lastMotifText = motifText;
    }

    // NOTE: Removing old canvas and creating a new one elminates border artifacts left when resizing on Safari
    $('#motif-canvas').remove();
    $('#motif-canvas-container').append('<canvas id="motif-canvas"></canvas>');

    var parsedMotif = my.parseMotif(motifText);
    my.drawMotif(parsedMotif, '#motif-canvas');

    // Generate image
    var canvasDataURL = $('#motif-canvas')[0].toDataURL('image/png');
    $('#motif-image-container').html('<img id="motif-image" src="' + canvasDataURL + '">');

  }; // generateMotif

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

  return my;

})(MotifSpeedWriter || {}, jQuery);
