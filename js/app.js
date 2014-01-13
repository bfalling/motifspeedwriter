var MotifSpeedWriter = (function() {

  var appObject = {};
  var lastMotifText = '';

  var devicePixelRatio = window.devicePixelRatio;
  var edgePadding = 20;
  var unitWidth = 24;
  var unitHeight = 32;
  var termPadding = 3;
  var mainMotifThickness = 2;
  var staffLineHeight = 3 * termPadding;

  var drawTerm = function(type, duration, midX, startY, thickness) {
    var canvas = $('#motif-canvas')[0];
    var context = canvas.getContext('2d');
    context.scale(devicePixelRatio, devicePixelRatio);
    context.lineWidth = thickness;
    context.strokeStyle = 'black';
    var stemHeight;
    switch (type) {
      case 'beginstaff':
      case 'endstaff':
        context.beginPath();
        context.moveTo(midX - unitWidth / 2, startY - termPadding);
        context.lineTo(midX + unitWidth / 2, startY - termPadding);
        context.moveTo(midX - unitWidth / 2, startY - 2 * termPadding);
        context.lineTo(midX + unitWidth / 2, startY - 2 * termPadding);
        context.stroke();
        break;
      case 'sp':
        context.beginPath();
        context.moveTo(midX - unitWidth / 4, startY - termPadding);
        context.lineTo(midX + unitWidth / 4, startY - termPadding);
        stemHeight = duration * unitHeight - 2 * termPadding;
        context.moveTo(midX, startY - termPadding);
        context.lineTo(midX, startY - termPadding - stemHeight);
        context.moveTo(midX - unitWidth / 4, startY - termPadding - stemHeight);
        context.lineTo(midX + unitWidth / 4, startY - termPadding - stemHeight);
        context.stroke();
        break;
      case 'cp':
        context.beginPath();
        context.arc(midX, startY - termPadding, unitWidth / 4, 0, Math.PI, true);
        context.stroke();
        context.beginPath();
        stemHeight = duration * unitHeight - 2 * termPadding - unitWidth / 4;
        context.moveTo(midX, startY - termPadding - unitWidth / 4);
        context.lineTo(midX, startY - termPadding - unitWidth / 4 - stemHeight);
        context.stroke();
        context.beginPath();
        context.arc(midX, startY - termPadding - stemHeight, unitWidth / 4, 0, Math.PI, true);
        context.stroke();
        break;  
      default:
        break;
    }
    // Restore context scale factor
    context.scale(1.0 / devicePixelRatio, 1.0 / devicePixelRatio);
  };

  var describeSequence = function(sequence) {
    var description = '';
    $.each(sequence, function(i, term) {
      description += term.code + '-' + term.duration + ' ';
      $.each(term.subsequences, function(i, subsequence) {
        description += '[' + describeSequence(subsequence) + '] ';
      });
    });
    return description;
  }; // describeSequence

  var parseTerm = function(termText) {
    // Separate actual term from simultaneous sequences
    var depth = 0;
    var subsequences = [];
    var subsequenceInProgress = '';
    var simpleTermInProgress = '';

    for (var i = 0, len = termText.length; i < len; i++) {
      var charToProcess = termText.charAt(i);
      switch(charToProcess) {
        case '(':
          if (depth === 0) {
            depth++;
            subsequenceInProgress = '';
          } else {
            subsequenceInProgress += charToProcess;
          }
          break;
        case ')':
          if (depth === 1) {
            depth--;
            subsequences.push(parseSequence(subsequenceInProgress));
          } else if (depth === 0) {
            console.log('Encountered extra right paren -- ignoring');
          } else {
            subsequenceInProgress += charToProcess;
          }
          break;
        default:
          if (depth === 0) {
            simpleTermInProgress += charToProcess;
          } else {
            subsequenceInProgress += charToProcess;
          }
          break;
      }
    }

    if (depth > 0) {
      subsequences.push(parseSequence(subsequenceInProgress));
    }

    var simpleTermRegexp = /(\D*)(\d.*)?/i
    var match = simpleTermRegexp.exec(simpleTermInProgress);

    return {
      code: match[1] ? match[1].toLowerCase() : 'nop',
      duration: match[2] ? parseFloat(match[2]) : 1.0,
      subsequences: subsequences
    };
  }; // parseTerm

  var parseSequence = function(sequenceText) {
    if (sequenceText === '') {
      return [];
    };
    // Split on top-level commas, and parse any inner groups
    var depth = 0;
    var terms = [];
    var termInProgress = '';
    for (var i = 0, len = sequenceText.length; i < len; i++) {
      var charToProcess = sequenceText.charAt(i);
      switch(charToProcess) {
        case ',':
          if (depth === 0) {
            terms.push(parseTerm(termInProgress));
            termInProgress = '';
          } else {
            termInProgress += charToProcess;
          }
          break;
        case '(':
          depth++;
          termInProgress += charToProcess;
          break;
        case ')':
          depth--;
          termInProgress += charToProcess;
          break;
        default:
          termInProgress += charToProcess;
          break;
      }
    }
    terms.push(parseTerm(termInProgress));
    return terms;
  }; // parseSequence

  appObject.generateMotif = function(motifText) {
    if (motifText === lastMotifText) {
      return;
    } else {
      lastMotifText = motifText;
    }

    var cleanMotifText = motifText.replace(/\s/g, '');

    var preSequence = [];
    var mainSequence = [];
    var motifWithStaffRegexp = /([^\|]*)\|\|([^\|]*)\|\|/;
    var match = motifWithStaffRegexp.exec(cleanMotifText);
    var showMotifStaff;
    if (match !== null) {
      showMotifStaff = true;
      preSequence = parseSequence(match[1]);
      mainSequence = parseSequence(match[2]);
    } else {
      showMotifStaff = false;
      mainSequence = parseSequence(cleanMotifText);
    }

    console.log('PreSequence: ' + describeSequence(preSequence));
    console.log('MainSequence: ' + describeSequence(mainSequence));

    // NOTE: Removing old canvas and creating a new one elminates border artifacts left when resizing on Safari
    $('#motif-canvas').remove();
    $('#motif-canvas-container').append('<canvas id="motif-canvas"></canvas>');
    
    // Determine canvas dimensions needed and resize it
    // TODO: Handle subsequences and column lengths and thus total width of all columns
    var preSequenceDuration = 0;
    $.each(preSequence, function(i, term) {
      preSequenceDuration += term.duration;
    });
    var mainSequenceDuration = 0;
    $.each(mainSequence, function(i, term) {
      mainSequenceDuration += term.duration;
    })
    var totalSequenceHeight = (preSequenceDuration + mainSequenceDuration) * unitHeight + (showMotifStaff ? 2 * staffLineHeight : 0);
    var totalCanvasWidth = unitWidth + 2 * edgePadding;
    var totalCanvasHeight = totalSequenceHeight + 2 * edgePadding;
    $('#motif-canvas').attr('width', totalCanvasWidth * devicePixelRatio).attr('height', totalCanvasHeight * devicePixelRatio).width(totalCanvasWidth).height(totalCanvasHeight);

    var currentY = edgePadding;
    var midX = totalCanvasWidth / 2;

    if (showMotifStaff) {
      $.each(preSequence, function(i, term) {
        drawTerm(term.code, term.duration, midX, totalCanvasHeight - currentY, mainMotifThickness);
        currentY += term.duration * unitHeight;
      });
      drawTerm('beginstaff', 0, midX, totalCanvasHeight - currentY, mainMotifThickness);
      currentY += staffLineHeight;
    };

    $.each(mainSequence, function(i, term) {
      drawTerm(term.code, term.duration, midX, totalCanvasHeight - currentY, mainMotifThickness);
      currentY += term.duration * unitHeight;
    });

    if (showMotifStaff) {
      drawTerm('endstaff', 0, midX, totalCanvasHeight - currentY, mainMotifThickness);
      currentY += staffLineHeight; // Currently, it occupies a one unit height space
    };

  }; // generateMotif

  return appObject;
})();

$(document).ready(function() {
  $('#motif-text-clear-button').click(function(event) {
    $('#motif-text').val('');
    $('#motif-canvas').remove();
    $('#motif-text').focus();
    event.preventDefault();
  });

  // keyup fires multiple events, so just catch and process first one
  $('#motif-text').keyup(function(event) {
    var $this = $(this);
    var val = $this.val();
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
      };
    };
    MotifSpeedWriter.generateMotif($(this).val());
  });

  $('#motif-text').focus();
});

/*
TODO:
- When pasting, sometimes doesn't update
- Add more symbols
- Be able to download image
- Take URL parameter
- Watch floats vs integers
*/
