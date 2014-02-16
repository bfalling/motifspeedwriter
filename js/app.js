var MotifSpeedWriter = (function() {

  var appObject = {};

  var devicePixelRatio = window.devicePixelRatio;
  var edgePadding = 30;
  var unitWidth = 28;
  var unitHeight = 28;
  var termPadding = 3;
  var symbolPartPadding = 4;
  var mainMotifThickness = 2;
  var staffLineHeight = 3 * termPadding;
  var holdCircleRadius = unitWidth / 9;
  var weightCenterRadius = unitWidth / 7;

  var numColumns;
  var columnAvailableUnits;

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
          depth++;
          if (depth === 1) {
            subsequenceInProgress = '';
          } else {
            subsequenceInProgress += charToProcess;
          }
          break;
        case ')':
          depth--;
          if (depth === 0) {
            subsequences.push(parseSequence(subsequenceInProgress));
          } else if (depth < 0) {
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
      duration: match[2] ? parseFloat(match[2]) : 1,
      subsequences: subsequences
    };
  }; // parseTerm

  var layoutSequence = function(sequence, startUnit) {
    sequence.startUnit = startUnit;

    // Compute sequence duration
    sequence.duration = 0;
    $.each(sequence, function(i, term) {
      sequence.duration += term.duration;
    });

    // Determine first available free column, or create new one
    for (var i = 0; i < numColumns; i++) {
      if (columnAvailableUnits[i] <= startUnit) {
        sequence.column = i;
        columnAvailableUnits[i] = startUnit + sequence.duration;
        break;
      }
    };
    if (sequence.column === undefined) {
      sequence.column = numColumns;
      columnAvailableUnits[numColumns] = startUnit + sequence.duration;
      numColumns++;
    }

    // Recurse through each term's subsequences, if present
    var currentUnit = 0;
    $.each(sequence, function(i, term) {
      $.each(term.subsequences, function(i, subsequence) {
        layoutSequence(subsequence, startUnit + currentUnit);
      });
      currentUnit += term.duration;
    });
  };

  var drawInitial = function() {
    var canvas = $('#motif-canvas');
    var context = canvas[0].getContext('2d');
    context.scale(devicePixelRatio, devicePixelRatio);

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width(), canvas.height());

    context.font = '0.1rem arial,sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'bottom';
    context.fillStyle = '#aaa';
    context.fillText('Motif SpeedWriter', canvas.width() / 2, canvas.height());

    // Restore context scale factor
    context.scale(1.0 / devicePixelRatio, 1.0 / devicePixelRatio);
  };

  var drawSequence = function(sequence, midX, startY) {
    var totalCanvasHeight = $('#motif-canvas').height();
    var column = sequence.column;
    var columnUnitShift = column % 2 === 1 ? (column + 1) / 2 : -(column / 2);
    var columnX = midX + columnUnitShift * unitWidth;
    var currentY = startY + sequence.startUnit * unitHeight;
    $.each(sequence, function(i, term) {
      drawTerm(term.code, term.duration, columnX, totalCanvasHeight - currentY, mainMotifThickness);
      currentY += term.duration * unitHeight;
      $.each(term.subsequences, function(i, subsequence) {
        drawSequence(subsequence, midX, startY);
      });
    });
  };

  var drawStaff = function(columnWidth, midX, startY) {
    var canvas = $('#motif-canvas')[0];
    var context = canvas.getContext('2d');
    context.scale(devicePixelRatio, devicePixelRatio);
    context.lineWidth = mainMotifThickness;
    context.strokeStyle = 'black';
    context.beginPath();
    var staffWidth = columnWidth * unitWidth;
    context.moveTo(midX - staffWidth / 2, startY - termPadding);
    context.lineTo(midX + staffWidth / 2, startY - termPadding);
    context.moveTo(midX - staffWidth / 2, startY - 2 * termPadding);
    context.lineTo(midX + staffWidth / 2, startY - 2 * termPadding);
    context.stroke();
    context.scale(1.0 / devicePixelRatio, 1.0 / devicePixelRatio);
  };

  var drawTerm = function(type, duration, midX, startY, thickness) {
    var canvas = $('#motif-canvas')[0];
    var context = canvas.getContext('2d');
    context.scale(devicePixelRatio, devicePixelRatio);
    context.lineWidth = thickness;
    context.strokeStyle = 'black';

    var p = function(code) {
      switch (code) {
        case 'pby':
          return startY - termPadding;
        case 'pty':
          return startY - duration * unitHeight + termPadding;
        case '-nar2':
          return midX - unitWidth / 5;
        case '+nar2':
          return midX + unitWidth / 5;
        case 'nar':
          return unitWidth / 2.5;
        case 'nar2':
          return unitWidth / 5;
        case 'plx':
          return midX - unitWidth / 2 + termPadding;
        case 'prx':
          return midX + unitWidth / 2 - termPadding;
        default:
          return termPadding;
      }
    };
    var drawPath = function(pathCommands) {
      $.each(pathCommands, function(i, pathCommand) {
        var params = pathCommand.params;
        switch (pathCommand.cmd) {
          case 'line':
            if (params.length > 1) {
              context.beginPath();
              var startPoint = params.shift();
              context.moveTo(startPoint[0], startPoint[1]);
              $.each(params, function(i, point) {
                context.lineTo(point[0], point[1]);
              });
              context.stroke();
            };
            break;
          case 'line-close':
            if (params.length > 1) {
              context.beginPath();
              var startPoint = params.shift();
              context.moveTo(startPoint[0], startPoint[1]);
              $.each(params, function(i, point) {
                context.lineTo(point[0], point[1]);
              });
              context.closePath();
              context.stroke();
            };
            break;
          case 'circle-hold':
            context.beginPath();
            context.arc(params[0], params[1], holdCircleRadius, 0, 2 * Math.PI, true);
            context.stroke();
            break;
          case 'circle-weight':
            context.beginPath();
            context.arc(params[0], params[1], weightCenterRadius, 0, 2 * Math.PI, true);
            context.stroke();
            context.fillStyle = 'black';
            context.fill();
            break;
          case 'arc': // Always counter-clockwise
            context.beginPath();
            context.arc(params[0], params[1], params[2], params[3], params[4], true);
            context.stroke();
            break;
          default:
            break;
        }
      });
    };

    switch (type) {
      case 'box':
        drawPath([
          { cmd: 'line-close', params: [
            [p('plx'), p('pby')],
            [p('plx'), p('pty')],
            [p('prx'), p('pty')],
            [p('prx'), p('pby')]
          ] }
        ]);
        break;
      case 'act':
        drawPath([
          { cmd: 'line', params: [[midX, p('pby')], [midX, p('pty')]] }
        ]);
        break;
      case 'ges':
        drawPath([
          { cmd: 'line', params: [[midX, p('pby')], [midX, p('pty')]] },
          { cmd: 'circle-hold', params: [midX, p('pby') - unitHeight / 3.5] }
        ]);
        break;
      case 'hold':
      case 'hol': // DEPRECATE 2/23
        drawPath([
          { cmd: 'circle-hold', params: [midX, p('pby') - holdCircleRadius] }
        ]);
        break;
      case 'path':
      case 'ap': // DEPRECATE 2/23
        context.beginPath();
        var quadraticCurveControlHeight = unitWidth / 10;
        context.moveTo(p('-nar2'), p('pby') + quadraticCurveControlHeight / 2);
        context.quadraticCurveTo(midX - unitWidth / 8, p('pby') - quadraticCurveControlHeight, midX, p('pby'));
        context.quadraticCurveTo(midX + unitWidth / 8, p('pby') + quadraticCurveControlHeight, p('+nar2'), p('pby') - quadraticCurveControlHeight / 2);
        context.stroke();
        drawPath([
          { cmd: 'line', params: [[midX, p('pby')], [midX, p('pty')]] }
        ]);
        context.beginPath();
        context.moveTo(midX - unitWidth / 4, p('pty') + quadraticCurveControlHeight / 2);
        context.quadraticCurveTo(midX - unitWidth / 8, p('pty') - quadraticCurveControlHeight, midX, p('pty'));
        context.quadraticCurveTo(midX + unitWidth / 8, p('pty') + quadraticCurveControlHeight, midX + unitWidth / 4, p('pty') - quadraticCurveControlHeight / 2);
        context.stroke();
        break;
      case 'stra':
      case 'sp': // DEPRECATE 2/23
        drawPath([
          { cmd: 'line', params: [[p('-nar2'), p('pby')], [p('+nar2'), p('pby')]] },
          { cmd: 'line', params: [[midX, p('pby')], [midX, p('pty')]] },
          { cmd: 'line', params: [[p('-nar2'), p('pty')], [p('+nar2'), p('pty')]] },
        ]);
        break;
      case 'curv':
      case 'cp': // DEPRECATE 2/23
        drawPath([
          { cmd: 'arc', params: [midX, p('pby'), p('nar2'), 0, Math.PI] },
          { cmd: 'line', params: [[midX, p('pby') - p('nar2')], [midX, p('pty')]] },
          { cmd: 'arc', params: [midX, p('pty') + p('nar2'), p('nar2'), 0, Math.PI] }
        ]);
        break;  
      case 'turn':
      case 'at': // DEPRECATE 2/23
        drawPath([
          { cmd: 'line-close', params: [
            [p('-nar2'), p('pby')],
            [midX, p('pby') - p('nar2')],
            [p('+nar2'), p('pby')],
            [p('+nar2'), p('pty')],
            [midX, p('pty') + p('nar2')],
            [p('-nar2'), p('pty')]
          ] }
        ]);
        break;
      case 'hturn':
      case 'rlturn':
      case 'lrturn':
      case 'avt': // DEPRECATE 2/23
        drawPath([
          { cmd: 'line-close', params: [
            [p('-nar2'), p('pby')],
            [p('+nar2'), p('pby') - p('nar')],
            [p('+nar2'), p('pty')],
            [p('-nar2'), p('pty') + p('nar')]
          ] },
          { cmd: 'line', params: [
            [midX, p('pby') - p('nar2')],
            [p('+nar2'), p('pby')],
            [p('+nar2'), p('pby') - p('nar')]
          ]},
          { cmd: 'line', params: [
            [midX, p('pty') + p('nar2')],
            [p('-nar2'), p('pty')],
            [p('-nar2'), p('pty') + p('nar')]
          ]}
        ]);
        break;
      case 'rhturn':
      case 'rturn':
      case 'rt': // DEPRECATE 2/23
        drawPath([
          { cmd: 'line-close', params: [
            [p('-nar2'), p('pby')],
            [p('+nar2'), p('pby') - p('nar')],
            [p('+nar2'), p('pty')],
            [p('-nar2'), p('pty') + p('nar')]
          ] }
        ]);
        break;
      case 'lhturn':
      case 'lturn':
      case 'lt': // DEPRECATE 2/23
        drawPath([
          { cmd: 'line-close', params: [
            [p('+nar2'), p('pby')],
            [p('-nar2'), p('pby') - p('nar')],
            [p('-nar2'), p('pty')],
            [p('+nar2'), p('pty') + p('nar')]
          ] }
        ]);
        break;
      case 'bala':
      case 'bal': // DEPRECATE 2/23
        drawPath([
          { cmd: 'line-close', params: [
            [p('-nar2'), p('pby') - 2 * weightCenterRadius - symbolPartPadding],
            [p('-nar2'), p('pty')],
            [p('+nar2'), p('pty')],
            [p('+nar2'), p('pby') - 2 * weightCenterRadius - symbolPartPadding]
          ] },
          { cmd: 'circle-weight', params: [midX, p('pby') - weightCenterRadius] }
        ]);
        break;
      case 'fall':
      case 'fal': // DEPRECATE 2/23
        var falDirectionStartY = p('pby') - 2 * weightCenterRadius - symbolPartPadding;
        var falDirectionHeight = falDirectionStartY - p('pty');
        drawPath([
          { cmd: 'line-close', params: [
            [p('-nar2'), p('pby') - 2 * weightCenterRadius - symbolPartPadding],
            [p('-nar2'), p('pty')],
            [p('+nar2'), p('pty')],
            [p('+nar2'), p('pby') - 2 * weightCenterRadius - symbolPartPadding]
          ] },
          { cmd: 'circle-weight', params: [midX, p('pby') - weightCenterRadius] },
          { cmd: 'line', params: [
            [midX - p('nar'), falDirectionStartY - falDirectionHeight / 4],
            [midX + p('nar'), p('pty') + falDirectionHeight / 4]
          ]}
        ]);
        break;
      case 'air':
        var airLaunchLandLength = (p('pby') - p('pty')) / 3;
        drawPath([
          { cmd: 'line', params: [[midX, p('pby')], [midX, p('pby') - airLaunchLandLength]] },
          { cmd: 'line', params: [[midX, p('pty') + airLaunchLandLength], [midX, p('pty')]] }
        ]);
        context.beginPath();
        context.moveTo(midX - termPadding, p('pby') - airLaunchLandLength);
        context.quadraticCurveTo(midX - p('nar') * .8, p('pby') - (p('pby') - p('pty')) / 2, midX - termPadding, p('pty') + airLaunchLandLength);
        context.moveTo(midX + termPadding, p('pby') - airLaunchLandLength);
        context.quadraticCurveTo(midX + p('nar') * .8, p('pby') - (p('pby') - p('pty')) / 2, midX + termPadding, p('pty') + airLaunchLandLength);
        context.stroke();
        break;
      default:
        break;
    }
    // Restore context scale factor
    context.scale(1.0 / devicePixelRatio, 1.0 / devicePixelRatio);
  };

  appObject.loadPage = function() {
    var match = location.search.match(/motif=([^&]*)/);
    if (match) {
      var motifText = decodeURIComponent(match[1] + '');
      $('#motif-text').val(motifText);
      MotifSpeedWriter.generateMotif(motifText);
      $('#motif-text').focus();
    } else {
      $('#motif-text-clear-button').click();
    }
  }; // loadPage

  var lastMotifText; // Leave undefined
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

    // DBG
    //console.log('PreSequence: ' + describeSequence(preSequence));
    //console.log('MainSequence: ' + describeSequence(mainSequence));

    // NOTE: Removing old canvas and creating a new one elminates border artifacts left when resizing on Safari
    $('#motif-canvas').remove();
    $('#motif-canvas-container').append('<canvas id="motif-canvas"></canvas>');

    // Determine canvas dimensions

    numColumns = 0;
    columnAvailableUnits = [];
    layoutSequence(preSequence, 0);
    var preSequenceNumColumns = numColumns;
    var maxPreSequenceDuration = 0;
    $.each(columnAvailableUnits, function(i, unit) {
      if (maxPreSequenceDuration < unit) {
        maxPreSequenceDuration = unit;
      }
    });

    numColumns = 0;
    columnAvailableUnits = [];
    layoutSequence(mainSequence, 0);
    var mainSequenceNumColumns = numColumns;
    var maxMainSequenceDuration = 0;
    $.each(columnAvailableUnits, function(i, unit) {
      if (maxMainSequenceDuration < unit) {
        maxMainSequenceDuration = unit;
      }
    });

    var maxNumColumns = Math.max(preSequenceNumColumns, mainSequenceNumColumns);
    var totalCanvasWidth = maxNumColumns * unitWidth + 2 * edgePadding;
    var totalCanvasHeight = (maxPreSequenceDuration + maxMainSequenceDuration) * unitHeight
                            + (showMotifStaff ? 2 * staffLineHeight : 0) + 2 * edgePadding;

    $('#motif-canvas').attr('width', totalCanvasWidth * devicePixelRatio).attr('height', totalCanvasHeight * devicePixelRatio)
                      .width(totalCanvasWidth).height(totalCanvasHeight);

    // Draw the motif

    drawInitial();

    var midX = totalCanvasWidth / 2;
    var currentY = edgePadding;

    if (showMotifStaff) {
      drawSequence(preSequence, midX - (preSequenceNumColumns % 2 === 0 ? unitWidth / 2 : 0), currentY);
      currentY += maxPreSequenceDuration * unitHeight;
      drawStaff(maxNumColumns, midX, totalCanvasHeight - currentY);
      currentY += staffLineHeight;
    };

    drawSequence(mainSequence, midX - (mainSequenceNumColumns % 2 === 0 ? unitWidth / 2 : 0), currentY);
    currentY += maxMainSequenceDuration * unitHeight;

    if (showMotifStaff) {
      drawStaff(maxNumColumns, midX, totalCanvasHeight - currentY);
      currentY += staffLineHeight;
    };

    // Generate image
    var canvasDataURL = $('#motif-canvas')[0].toDataURL('image/png');
    $('#motif-image-container').html('<img id="motif-image" src="' + canvasDataURL + '">');

  }; // generateMotif

  return appObject;
})();

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
      };
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
