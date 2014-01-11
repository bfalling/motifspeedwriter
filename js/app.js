var MotifSpeedWriter = (function() {

  var appObject = {};
  var lastMotifText = '';

  var devicePixelRatio = window.devicePixelRatio;
  var edgePadding = 10;
  var unitWidth = 16;
  var unitHeight = 26;
  var mainMotifThickness = 2;

  var drawTerm = function(type, duration, midX, startY, thickness) {
    var canvas = $('#motif-canvas')[0];
    var context = canvas.getContext('2d');
    context.scale(devicePixelRatio, devicePixelRatio);
    switch (type) {
      case 'sp':
        context.beginPath();
        context.lineWidth = thickness;
        context.strokeStyle = 'black';
        context.moveTo(midX - unitWidth / 4, startY - 3);
        context.lineTo(midX + unitWidth / 4, startY - 3);
        context.moveTo(midX, startY - 3);
        context.lineTo(midX, startY - unitHeight * duration + 3);
        context.moveTo(midX - unitWidth / 4, startY - unitHeight * duration + 3);
        context.lineTo(midX + unitWidth / 4, startY - unitHeight * duration + 3);
        context.stroke();
        break;
    }
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
    if (match !== null) {
      preSequence = this.parseSequence(match[1]);
      mainSequence = this.parseSequence(match[2]);
    } else {
      mainSequence = this.parseSequence(cleanMotifText);
    }

    console.log('PreSequence: ' + this.describeSequence(preSequence));
    console.log('MainSequence: ' + this.describeSequence(mainSequence));

    // TODO: Time to render!
    // - Render sequence fom starting point
    // - Handle columns
    // - Compute vertical length of each column
    // - Add staff if appropriate
    // - Set canvas size

    // Test basic drawing
    $('#motif-canvas').attr('width', 500).attr('height', 400).width(250).height(200);
    drawTerm('sp', 1, $('#motif-canvas').width() / 2, $('#motif-canvas').height() - edgePadding, mainMotifThickness);

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
- Take URL parameter
*/
