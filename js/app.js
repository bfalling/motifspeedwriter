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
        var stemHeight = duration * unitHeight - 2 * termPadding;
        context.moveTo(midX, startY - termPadding);
        context.lineTo(midX, startY - termPadding - stemHeight);
        context.moveTo(midX - unitWidth / 4, startY - termPadding - stemHeight);
        context.lineTo(midX + unitWidth / 4, startY - termPadding - stemHeight);
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

    // Clear old canvas TODO
    //context.clearRect(0, 0, $('#motif-canvas').width, $('#motif-canvas').height);

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

    // TODO: Time to render!
    // - Render sequence fom starting point
    // - Handle columns
    // - Compute vertical length of each column
    // - Add staff if appropriate
    // - Set canvas size

    // Test basic drawing
    //$('#motif-canvas').attr('width', 500).attr('height', 400).width(250).height(200);
    //drawTerm('sp', 1, $('#motif-canvas').width() / 2, $('#motif-canvas').height() - edgePadding, mainMotifThickness);

  }; // generateMotif

  return appObject;
})();

$(document).ready(function() {
  $('#motif-text-clear-button').click(function(event) {
    $('#motif-text').val('');
    MotifSpeedWriter.generateMotif('');
    event.preventDefault();
  });

  // keyup fires multiple events, so just catch and process first one
  $('#motif-text').keyup(function() {
    MotifSpeedWriter.generateMotif($(this).val());
  });

  $('#motif-text').focus();
});

/*
TODO:
- Clear canvas when type
- Take URL parameter
- Watch floats vs integers
*/
