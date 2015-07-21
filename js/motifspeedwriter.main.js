var jQuery = jQuery || {};

var MotifSpeedWriter = (function(my, $) {
  'use strict';

  my.prepareCanvasContext = function() {
    my.canvas = $('#motif-canvas')[0];
    my.context = my.canvas.getContext('2d');
    my.context.scale(my.defs.devicePixelRatio, my.defs.devicePixelRatio);
  }

  my.finishCanvasContext = function() {
    my.context.scale(1.0 / my.defs.devicePixelRatio, 1.0 / my.defs.devicePixelRatio);
  }

  var layoutMotif = function(parsedMotif) {
    var preSequenceLayout = layoutMotifPart(parsedMotif.preSequence);
    var mainSequenceLayout = layoutMotifPart(parsedMotif.mainSequence);
    var maxNumColumns = Math.max(preSequenceLayout.numColumns, mainSequenceLayout.numColumns);
    var totalCanvasWidth = maxNumColumns * my.defs.unitSize + 2 * my.defs.edgePadding;
    var totalCanvasHeight = (preSequenceLayout.maxDuration + mainSequenceLayout.maxDuration) * my.defs.unitSize +
                            (parsedMotif.showMotifStaff ? 2 * my.defs.staffLineHeight : 0) + 2 * my.defs.edgePadding;
    return {
      preSequenceNumColumns: preSequenceLayout.numColumns,
      preSequenceMaxDuration: preSequenceLayout.maxDuration,
      mainSequenceNumColumns: mainSequenceLayout.numColumns,
      mainSequenceMaxDuration: mainSequenceLayout.maxDuration,
      maxNumColumns: maxNumColumns,
      width: totalCanvasWidth,
      height: totalCanvasHeight
    };
  };

  var layoutMotifPart = function(partSequence) {
    var numColumns = 0;
    var freePositionForColumn = [];
    var layoutSequence = function(sequence, startUnit) {
      sequence.startUnit = startUnit;

      // Compute sequence duration
      sequence.duration = 0;
      $.each(sequence, function(i, term) {
        sequence.duration += term.duration;
      });

      // Determine first available free column, or create new one
      for (var i = 0; i < numColumns; i++) {
        if (freePositionForColumn[i] <= startUnit) {
          sequence.column = i;
          freePositionForColumn[i] = startUnit + sequence.duration;
          break;
        }
      }
      if (sequence.column === undefined) {
        sequence.column = numColumns;
        freePositionForColumn[numColumns] = startUnit + sequence.duration;
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

    layoutSequence(partSequence, 0);
    var maxDuration = 0;
    $.each(freePositionForColumn, function(i, unit) {
      maxDuration = Math.max(maxDuration, unit);
    });
    return {
      numColumns: numColumns,
      maxDuration: maxDuration
    };
  }

  var drawInitial = function() {
    my.prepareCanvasContext();

    my.context.fillStyle = 'white';
    my.context.fillRect(0, 0, my.canvas.width, my.canvas.height);

    my.context.font = '0.1rem arial,sans-serif';
    my.context.textAlign = 'center';
    my.context.textBaseline = 'bottom';
    my.context.fillStyle = '#aaa';
    my.context.fillText('Motif SpeedWriter', my.canvas.width / 2, my.canvas.height);

    my.finishCanvasContext();
  };

  my.drawMotif = function(parsedMotif, selector) {
    var showMotifStaff = parsedMotif.showMotifStaff;
    var preSequence = parsedMotif.preSequence;
    var mainSequence = parsedMotif.mainSequence;

    var layout = layoutMotif(parsedMotif);

    // TODO: Why 2 widths/heights?
    $(selector).attr('width', layout.width * my.defs.devicePixelRatio).attr('height', layout.height * my.defs.devicePixelRatio)
                      .width(layout.width).height(layout.height);

    drawInitial();

    var midX = layout.width / 2;
    var currentY = my.defs.edgePadding;

    if (showMotifStaff) {
      drawSequence(preSequence, midX - (layout.preSequenceNumColumns % 2 === 0 ? my.defs.unitSize / 2 : 0), currentY);
      currentY += layout.preSequenceMaxDuration * my.defs.unitSize;
      drawStaff(layout.maxNumColumns, midX, layout.height - currentY);
      currentY += my.defs.staffLineHeight;
    }

    drawSequence(mainSequence, midX - (layout.mainSequenceNumColumns % 2 === 0 ? my.defs.unitSize / 2 : 0), currentY);
    currentY += layout.mainSequenceMaxDuration * my.defs.unitSize;

    if (showMotifStaff) {
      drawStaff(layout.maxNumColumns, midX, layout.height - currentY);
      currentY += my.defs.staffLineHeight;
    }
  };

  var drawSequence = function(sequence, midX, startY) {
    var totalCanvasHeight = $('#motif-canvas').height();
    var column = sequence.column;
    var columnUnitShift = column % 2 === 1 ? (column + 1) / 2 : -(column / 2);
    var columnX = midX + columnUnitShift * my.defs.unitSize;
    var currentY = startY + sequence.startUnit * my.defs.unitSize;
    $.each(sequence, function(i, term) {
      my.drawTerm(term, columnX, totalCanvasHeight - currentY);
      currentY += term.duration * my.defs.unitSize;
      $.each(term.subsequences, function(i, subsequence) {
        drawSequence(subsequence, midX, startY);
      });
    });
  };

  var drawStaff = function(columnWidth, midX, startY) {
    var canvas = $('#motif-canvas')[0];
    var context = canvas.getContext('2d');
    context.scale(my.defs.devicePixelRatio, my.defs.devicePixelRatio);
    context.lineWidth = my.defs.mainMotifThickness;
    context.strokeStyle = 'black';
    context.beginPath();
    var staffWidth = columnWidth * my.defs.unitSize;
    context.moveTo(midX - staffWidth / 2, startY - my.defs.termPadding);
    context.lineTo(midX + staffWidth / 2, startY - my.defs.termPadding);
    context.moveTo(midX - staffWidth / 2, startY - 2 * my.defs.termPadding);
    context.lineTo(midX + staffWidth / 2, startY - 2 * my.defs.termPadding);
    context.stroke();
    context.scale(1.0 / my.defs.devicePixelRatio, 1.0 / my.defs.devicePixelRatio);
  };

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

  var lastMotifText; // Leave undefined
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

  return my;

})(MotifSpeedWriter || {}, jQuery);
