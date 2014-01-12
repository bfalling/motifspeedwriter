var MotifSpeedWriter = (function() {

  var appObject = {};
  var lastMotifText = '';

  var devicePixelRatio = window.devicePixelRatio;
  var edgePadding = 20;
  var unitWidth = 24;
  var unitHeight = 32;
  var termPadding = 3;
  var mainMotifThickness = 2;

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
      case 'sp': // TODO: Need greater detail
        context.beginPath();
        context.moveTo(midX - unitWidth / 4, startY - termPadding);
        context.lineTo(midX + unitWidth / 4, startY - termPadding);
        context.moveTo(midX, startY - termPadding);
        context.lineTo(midX, startY - unitHeight * duration + termPadding); //  TODO
        context.moveTo(midX - unitWidth / 4, startY - unitHeight * duration + termPadding); // TODO
        context.lineTo(midX + unitWidth / 4, startY - unitHeight * duration + termPadding); // TODO
        context.stroke();
        break;
      default:
        break;
    }
    // Restore context scale factor
    context.scale(1.0 / devicePixelRatio, 1.0 / devicePixelRatio);
  };

  appObject.describeSequence = function(sequence) {
    var description = '';
    $.each(sequence, function(i, term) {
      description += term.code + '-' + term.duration + ' ';
      $.each(term.subsequences, function(i, subsequence) {
        // NOTE: Needed to explicitly name top-level object (not "this") or function wouldn't work
        description += '[' + MotifSpeedWriter.describeSequence(subsequence) + '] ';
      });
    });
    return description;
  }; // describeSequence

  appObject.parseTerm = function(termText) {
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
            subsequences.push(this.parseSequence(subsequenceInProgress));
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
      subsequences.push(this.parseSequence(subsequenceInProgress));
    }

    var simpleTermRegexp = /(\D*)(\d.*)?/i
    var match = simpleTermRegexp.exec(simpleTermInProgress);

    return {
      code: match[1] ? match[1].toLowerCase() : 'nop',
      duration: match[2] ? parseFloat(match[2]) : 1.0,
      subsequences: subsequences
    };
  }; // parseTerm

  appObject.parseSequence = function(sequenceText) {
    // Split on top-level commas, and parse any inner groups
    var depth = 0;
    var terms = [];
    var termInProgress = '';
    for (var i = 0, len = sequenceText.length; i < len; i++) {
      var charToProcess = sequenceText.charAt(i);
      switch(charToProcess) {
        case ',':
          if (depth === 0) {
            terms.push(this.parseTerm(termInProgress));
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
    terms.push(this.parseTerm(termInProgress));
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
      preSequence = this.parseSequence(match[1]);
      mainSequence = this.parseSequence(match[2]);
    } else {
      showMotifStaff = false;
      mainSequence = this.parseSequence(cleanMotifText);
    }

    console.log('PreSequence: ' + this.describeSequence(preSequence));
    console.log('MainSequence: ' + this.describeSequence(mainSequence));

    // Clear old canvas TODO
    //context.clearRect(0, 0, $('#motif-canvas').width, $('#motif-canvas').height);

    // Determine canvas dimensions needed and resize it
    // TODO: Handle subsequences and column lengths and thus total width of all columns
    var preSequenceHeight = 0;
    $.each(preSequence, function(i, term) {
      preSequenceHeight += term.duration;
    });
    var mainSequenceHeight = 0;
    $.each(mainSequence, function(i, term) {
      mainSequenceHeight += term.duration;
    })
    var totalSequenceHeight = mainSequenceHeight + (showMotifStaff ? preSequenceHeight + 2 : 0);
    var totalCanvasWidth = unitWidth + 2 * edgePadding;
    var totalCanvasHeight = totalSequenceHeight * unitHeight + 2 * edgePadding;
    $('#motif-canvas').attr('width', totalCanvasWidth * devicePixelRatio).attr('height', totalCanvasHeight * devicePixelRatio).width(totalCanvasWidth).height(totalCanvasHeight);

    var currentY = edgePadding;

    if (showMotifStaff) {
      $.each(preSequence, function(i, term) {
        drawTerm(term.code, term.duration, $('#motif-canvas').width() / 2, $('#motif-canvas').height() - currentY, mainMotifThickness);
        currentY += term.duration * unitHeight;
      });
      drawTerm('beginstaff', 1, $('#motif-canvas').width() / 2, $('#motif-canvas').height() - currentY, mainMotifThickness);
      currentY += unitHeight; // Currently, it occupies a one unit height space
    };

    $.each(mainSequence, function(i, term) {
      drawTerm(term.code, term.duration, $('#motif-canvas').width() / 2, $('#motif-canvas').height() - currentY, mainMotifThickness);
      currentY += term.duration * unitHeight;
    });

    if (showMotifStaff) {
      drawTerm('endstaff', 1, $('#motif-canvas').width() / 2, $('#motif-canvas').height() - currentY, mainMotifThickness);
      currentY += unitHeight; // Currently, it occupies a one unit height space
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
- Shorten Motif staff units
- Use correct Straight Path lengths
- Review code
- Clear canvas when type
- Take URL parameter
- Watch floats vs integers
*/
