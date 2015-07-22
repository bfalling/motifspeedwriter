var jQuery = jQuery || {};

var MotifSpeedWriter = (function(my, $) {
  'use strict';

  my.prepareCanvasContext = function() {
    my.context = my.motifCanvas[0].getContext('2d');
    my.context.scale(my.defs.devicePixelRatio, my.defs.devicePixelRatio);
  };

  my.finishCanvasContext = function() {
    my.context.scale(1.0 / my.defs.devicePixelRatio, 1.0 / my.defs.devicePixelRatio);
  };

  my.drawMotif = function(parsedMotif) {
    var shouldShowMotifStaff = parsedMotif.showMotifStaff;
    var layout = layoutMotif(parsedMotif);

    prepareCanvas(layout.width, layout.height);

    var midX = layout.width / 2;
    var currentY = my.defs.edgePadding;

    if (shouldShowMotifStaff) {
      drawSequence(parsedMotif.preSequence, midX - (layout.preSequence.numColumns % 2 === 0 ? my.defs.unitSize / 2 : 0), currentY);
      currentY += layout.preSequence.maxDuration * my.defs.unitSize;
      drawStaff(layout.maxNumColumns, midX, layout.height - currentY);
      currentY += my.defs.staffLineHeight;
    }

    drawSequence(parsedMotif.mainSequence, midX - (layout.mainSequence.numColumns % 2 === 0 ? my.defs.unitSize / 2 : 0), currentY);
    currentY += layout.mainSequence.maxDuration * my.defs.unitSize;

    if (shouldShowMotifStaff) {
      drawStaff(layout.maxNumColumns, midX, layout.height - currentY);
      currentY += my.defs.staffLineHeight;
    }
  };

  var layoutMotif = function(parsedMotif) {
    var preSequenceLayout = layoutMotifPart(parsedMotif.preSequence);
    var mainSequenceLayout = layoutMotifPart(parsedMotif.mainSequence);
    var maxNumColumns = Math.max(preSequenceLayout.numColumns, mainSequenceLayout.numColumns);
    var totalCanvasWidth = maxNumColumns * my.defs.unitSize + 2 * my.defs.edgePadding;
    var totalCanvasHeight = (preSequenceLayout.maxDuration + mainSequenceLayout.maxDuration) * my.defs.unitSize +
                            (parsedMotif.showMotifStaff ? 2 * my.defs.staffLineHeight : 0) + 2 * my.defs.edgePadding;
    return {
      preSequence: preSequenceLayout,
      mainSequence: mainSequenceLayout,
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
  };

  var prepareCanvas = function(width, height) {

    // Browser hack: turning off the border during resizing avoids
    //               occasional artifacts on Mac Safari
    my.motifCanvas.css('border', 'none');

    // I can't explain this, but without the seeming redundant setting of
    // width and height below, the Motif will either fail to render or else
    // be completely distorted.
    my.motifCanvas.attr('width', width * my.defs.devicePixelRatio)
                  .attr('height', height * my.defs.devicePixelRatio)
                  .width(width)
                  .height(height);

    // Other side of the browser hack (see above)
    my.motifCanvas.css('border', '1px solid #ccc');

    my.prepareCanvasContext();

    // Sometimes helps with clearing artifacts
    my.context.clearRect(0, 0, width, height);

    my.context.fillStyle = 'white';
    my.context.fillRect(0, 0, width, height);

    my.context.font = '0.1rem arial,sans-serif';
    my.context.textAlign = 'center';
    my.context.textBaseline = 'bottom';
    my.context.fillStyle = '#aaa';
    my.context.fillText('Motif SpeedWriter', width / 2, height);

    my.finishCanvasContext();
  };

  var drawSequence = function(sequence, midX, startY) {
    var totalCanvasHeight = my.motifCanvas.height();
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
    my.prepareCanvasContext();

    my.context.lineWidth = my.defs.mainMotifThickness;
    my.context.strokeStyle = 'black';
    my.context.beginPath();
    var staffWidth = columnWidth * my.defs.unitSize;
    my.context.moveTo(midX - staffWidth / 2, startY - my.defs.termPadding);
    my.context.lineTo(midX + staffWidth / 2, startY - my.defs.termPadding);
    my.context.moveTo(midX - staffWidth / 2, startY - 2 * my.defs.termPadding);
    my.context.lineTo(midX + staffWidth / 2, startY - 2 * my.defs.termPadding);
    my.context.stroke();

    my.finishCanvasContext();
  };

  return my;

})(MotifSpeedWriter || {}, jQuery);
